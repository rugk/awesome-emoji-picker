import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import eslint from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
    globalIgnores([
        "src/common/modules/*/*",
        "!src/common/modules/data/*",
        "src/tests/helper",
        "node_modules/*",
        "src/node_modules/*",
    ]),

    eslint.configs.recommended,
    // JSDoc plugin recommended rules (error level)
    jsdoc.configs["flat/recommended-error"],

    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },
            ecmaVersion: 2023,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    impliedStrict: true,
                },
            },
        },

        plugins: {
            jsdoc
        },

        rules: {
            // base rules
            semi: 1,
            "semi-style": 2,
            "semi-spacing": 1,
            camelcase: 2,
            quotes: ["warn", "double", {
                avoidEscape: true,
                allowTemplateLiterals: false,
            }],

            "brace-style": 2,
            // just to make sure (are defaults)
            indent: ["error", 4],
            // allow console output for errors in browsers
            "no-console": 0,
            // technically required, because of CSP
            "no-eval": 2,
            "no-implied-eval": 2,
            "prefer-const": ["error", {
                destructuring: "all",
            }],
            "no-var": 1,
            "prefer-arrow-callback": 1,
            "implicit-arrow-linebreak": 1,
            "arrow-parens": 1,
            "arrow-spacing": 1,
            "no-confusing-arrow": 1,
            "prefer-rest-params": 2,
            "prefer-spread": 2,
            "prefer-template": 1,
            "template-curly-spacing": 1,
            "symbol-description": 2,
            "object-shorthand": ["warn", "consistent-as-needed"],
            "prefer-promise-reject-errors": 2,
            "prefer-numeric-literals": 1,
            "no-new-object": 2,
            eqeqeq: ["error", "smart"],
            curly: ["error", "all"],
            "dot-location": ["error", "property"],
            "dot-notation": 2,
            "no-array-constructor": 2,
            "no-throw-literal": 2,
            "no-self-compare": 2,
            "no-useless-call": 1,
            "consistent-return": 2,
            "spaced-comment": 1,
            "no-multi-spaces": 1,
            "no-new-wrappers": 2,
            "no-script-url": 2,
            "no-void": 1,
            "vars-on-top": 1,
            yoda: ["error", "never"],
            /* "no-warning-comments": 1, */ // should be enabled later
            "require-await": 1,
            "wrap-iife": ["error", "inside"],
            "no-loop-func": 2,
            "no-unused-expressions": 2,

            // custom JSDoc additions on top of recommended-error
            "jsdoc/require-returns-description": "warn",
            "jsdoc/require-param-description": "warn",
            "jsdoc/tag-lines": ["error", "any",{"startLines":1}],
        },
    },
]);
