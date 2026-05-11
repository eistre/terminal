# Thesis LaTeX Project

This directory contains the LaTeX source for the thesis.

The setup is adapted from the University of Tartu Institute of Computer Science bachelor's and master's thesis template:
https://gitlab.cs.ut.ee/unitartucs-thesis-templates/bsc-msc-latex-template

For official formatting requirements, refer to the University of Tartu Institute of Computer Science thesis guidelines:
https://cs.ut.ee/en/content/thesis-deadlines-and-guidelines

## Structure

- `main.tex` - main LaTeX entrypoint and thesis metadata
- `config.tex` - bibliography and document configuration
- `references.bib` - bibliography database
- `sections/` - thesis sections
- `figures/` - figures and appendix evidence screenshots
- `unitartucs/` - adapted thesis class, localization, and citation style files
- `.output/` - generated build output, ignored by git

## Build

On macOS, install the LaTeX dependencies from the repository root:

```bash
brew bundle --file thesis/Brewfile
```

Build the thesis from the repository root:

```bash
pnpm thesis
```

The generated PDF is written to:

```text
thesis/.output/main.pdf
```

When working directly inside this directory, the equivalent build command is:

```bash
latexmk -pdf main.tex
```
