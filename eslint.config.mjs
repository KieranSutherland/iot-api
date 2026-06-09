import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const config = [
    {
        ignores: [
            'eslint.config.mjs',
            '**/jest.config.js',
            '**/jest.itest.config.js',
            '**/node_modules',
            '**/build',
            '**/coverage'
        ]
    },
    {
        files: ['**/*.{itest,test}.{js,ts,tsx}', '**/src/setup-tests.ts', '**/src/**/test-util.ts', '**/src/**/*test-helpers.ts']
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ['**/src/**/*.ts'],
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        languageOptions: {
            parser: tsParser,       // <-- this is what was missing
            ecmaVersion: 2023,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    }
];

export default config;