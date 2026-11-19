# Test fixtures

`valid/` is a small, fake content set laid out like the real repository (`src/content`, `src/data`).
It passes every schema and check. Unit tests copy it to a temporary folder, break one thing, and
assert that the check fails with the expected message. Nothing here is real content or real model output.
