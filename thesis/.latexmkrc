# Add --shell-escape flag needed for minted
$latex = 'latex  %O  --shell-escape %S';
#$pdflatex = 'pdflatex  %O  --shell-escape %S';
$pdflatex = 'lualatex -file-line-error %O --shell-escape %S';
$pdf_mode = 1;
$out_dir = '.output';

# Prefer the local latexminted wrapper so minted runs with Python 3.13.
ensure_path( 'PATH', '.' );
