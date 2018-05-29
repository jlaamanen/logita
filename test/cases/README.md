# Test cases

All directories here will be automatically run in unit tests. To add a new test case:

1. Add a new directory with a numerical prefix (the unit tests will be run in alphabetical order)
2. Add `index.ts` as the entrypoint file for the test case
3. Write the expected outputs to `expected-stdout.txt` and `expected-stderr.txt` files. You can add escape sequences (e.g. for coloring) by writing the ESC unicode character `\u001b`, it will be unescaped when comparing the results.

If test case would require more comparison or parsing logic, please add a new test case manually.
