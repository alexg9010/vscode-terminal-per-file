# Advanced matching (regex)

`includeExtensions` and `startupCommands` (see the main [README](../README.md))
cover the common case: a fixed list of extensions, each optionally mapped to
one startup command. The two settings below exist for cases that don't fit a
plain extension list — matching by path/filename pattern instead of just the
extension, or picking a different command depending on where a file lives.
Most users won't need them.

Both settings are matched against the file's **full absolute path**, not just
its extension or basename, using JavaScript `RegExp` syntax (no delimiters,
no flags - e.g. `\\.test\\.js$`, not `/\.test\.js$/`). An invalid pattern
shows an error notification once (per distinct pattern string) and is then
treated as never matching, rather than breaking the extension.

## `terminalPerFile.ignorePattern`

A single regular expression. Any file whose full path matches is left alone
entirely - no terminal is created or shown for it, even if it matches
`includeExtensions`. Set to `""` to disable it and not ignore anything beyond
what `includeExtensions` already excludes.

Evaluated *after* `includeExtensions`, so it's a way to carve out exceptions
from an otherwise-included set:

```json
{
  "terminalPerFile.includeExtensions": ["R", "Rmd"],
  "terminalPerFile.ignorePattern": "/renv/|_cache/"
}
```

This pins terminals for `.R`/`.Rmd` files as usual, but skips anything under
an `renv/` or `*_cache/` directory (e.g. R Markdown's knitr cache folders).

### Shipped default

Out of the box (`includeExtensions` empty, i.e. every file type in play),
`ignorePattern` defaults to skipping common noise rather than pinning a
terminal to literally everything you open:

```
(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|poetry\.lock|Gemfile\.lock|composer\.lock)$|\.(log|min\.js|min\.css|map)$|(^|/)(node_modules|dist|build|out|\.next|\.git)/
```

That's: lock files, `*.log`/`*.min.js`/`*.min.css`/`*.map`, and anything
under `node_modules/`, `dist/`, `build/`, `out/`, `.next/`, or `.git/`.
Deliberately narrow - things like `.json`, `.yaml`, `.env` or `.md` are left
included by default, since plenty of workflows want a terminal open while
editing config or docs too. Override or clear this setting if it excludes
something you actually want a terminal for.

### Example: R/Rmd only, the strict way

If you set `includeExtensions: ["R", "Rmd"]` (see the main
[README](../README.md)), you already get exactly this. As a pure regex
alternative - e.g. if you'd rather keep everything in one `ignorePattern`
knob instead of combining it with `includeExtensions` - a negative lookahead
achieves the same thing by ignoring every path that does *not* end in `.R`
or `.Rmd`:

```json
{
  "terminalPerFile.ignorePattern": "^(?!.*\\.(R|Rmd)$).*$"
}
```

This replaces the shipped default entirely, so nothing else on the noise
list above is needed - excluding everything except `.R`/`.Rmd` already
excludes lock files, logs, `node_modules`, etc. too.

## `terminalPerFile.startupCommandRules`

An ordered list of `{ "pattern": "...", "command": "..." }` rules. On
creating a new terminal, each rule's `pattern` is tested against the file's
full path in order, and the `command` of the **first match** is sent to the
terminal. If no rule matches, this falls back to `startupCommands` (matched
by plain extension).

Use this when a single extension needs different startup behavior depending
on location, or when one pattern should cover several extensions at once:

```json
{
  "terminalPerFile.includeExtensions": ["R", "Rmd"],
  "terminalPerFile.startupCommandRules": [
    { "pattern": "/tests/.*\\.R$", "command": "R --no-save --quiet -e 'testthat::test_dir(\".\")'" },
    { "pattern": "\\.(R|Rmd)$", "command": "R" }
  ]
}
```

Here, R scripts under a `tests/` directory run the test runner instead of
dropping into a plain R console, while every other `.R`/`.Rmd` file still
gets a plain `R` console via the second, more general rule.

## Precedence, end to end

For a newly active file, in order:

1. `includeExtensions` - if non-empty and the file's extension isn't listed, stop (untouched).
2. `ignorePattern` - if set and it matches the full path, stop (untouched).
3. A terminal is pinned/shown for the file (or its directory, in `"directory"` scope).
4. If the terminal is newly created: `startupCommandRules` is checked first (first match wins), then `startupCommands` (by extension) if no rule matched.
