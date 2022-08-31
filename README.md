# Bureau Works API Command Line Interface and NodeJS module
This repository contains a JavaScript library that can be used to access the Bureau Works API. It also includes a CLI written in NodeJS that facilitates API calls from the command line.

**ATTENTION**

**This version of our CLI is only compatible with 1.0 projects**. 1.0 Projects are deprecated and entering EOL. We are actively working on a new version of our CLI that includes 2.0 projects, support for translation memory and glossary operations, localization kits, among other functionalities present in BWX.


## Requirements

You need a Bureau Works account and API KEY. Please visit https://www.bureauworks.com to get yours!

You will also need NodeJS and git installed in your environment.

For API reference, please visit https://dev.bureauworks.com

## Installation

Clone this repository:

```$ git clone https://github.com/bureauworks/bwx.git```

Install dependencies

```$ npm i```

Make the CLI friends with your shell environment

```$ chmod +x cli.js```

Run the Configuration once - this will create a `config.json` file in your `~/.bwx/` directory. You can get an API KEY at https://app.bureau.works once you log in the system, under your Profile.

```$ ./cli.js config```

You should see a message confirming the file creation now test the API with the CLI!

```$ ./cli.js services```

```$ ./cli.js languages```

You can use `npm link` to allow us to locally ‘symlink a package folder’. If you do so, you can call the CLI anywhere in your system with the `bwx` shorthand:

```$ bwx timezones```

```$ bwx languages```

For the help, use:

```$ bwx --help```

Or for specific commands, for example, the project creation command:

```$ bwx create --help```
