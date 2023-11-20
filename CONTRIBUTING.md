# Contributing

Thank you for considering contributing to Nima! Please take a moment to read these instructions before getting started.

## Development Environment

Follow these steps after cloning the repository to get the development environment up and running for testing.

1. Install dependencies

    ```bash
    npm install
    ```

2. Run dev script

    This will start the `tsc` compiler in watch mode, as well as running `dev.js`, which sets up another watcher that will update the Nima Engine TypeScript template as you make edits to it.

    ```bash
    npm run dev
    ```

3. Set up testing environment

    You can set up a testing environment in order to test your changes. Create a project using Vite, Remix, Next.js, Vue, vanilla, or whatever framework you wish to test with in a separate directory from the Nima test environment. Run the following command in the root of the Nima dev project

    ```bash
    npm link
    ```

    and the following command in the testing project:

    ```bash
    npm link nimajs
    ```

    This way you can test your changes live in a project environment.

## Code of Conduct

We seek to foster a welcoming and friendly development environment, free from unnecessary conflict or discrimination. Anyone who does not follow these guidelines is subject to a warning or temporary or permanent ban at the discretion of the project managers. Discrimination based on personal appearance or conviction outside of reasonable boundaries will not be tolerated. We are united under our love for code and goal of creating something for others to use; keep personal conflicts and issues out of the scope of this project.

### Reporting Issues

Feel free to report any concerns or violations to the project founder at [jaypixl95@gmail.com](mailto:jaypixl95@gmail.com).

Thank you for participating in this community!

<p style="text-align:right">- Nima Founder, Joshua Lawrence, Jr</p>
