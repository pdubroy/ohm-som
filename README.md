# ohm-som

A JavaScript implementation of [SOM](http://som-st.github.io/), a minimal Smalltalk for teaching and research. Just a hobby, won't be big and professional like TruffleSOM.

## Status

**2021-05-23:** ⚠️ Under construction⚠️, but it now passes the majority of the [SOM test suite](./third_party/SOM-st/SOM/TestSuite).

## Scripts

- `npm test` runs the smaller unit / integration tests (should all pass)
- `npm run som-test-suite` runs the SOM test suite (not expected to pass yet)

### Debugging

There are two environment variables you can set to make debugging easier.

Use `DEBUG_GENERATED_CLASSES=true` to write out the generated JS code for all SOM classes as they are loaded. These are written to the same directory as the original SOM source. E.g., for Array.som, the generated code will be written to Array.som.js.

If you set `USE_PREGENERATED_CLASSES=true`, the runtime will use the pre-generated JS code from the appropriate `.som.js` file if it exists. This allows you to easily insert console.log statements, etc. into the JavaScript code, making it easier to debug runtime issues.
