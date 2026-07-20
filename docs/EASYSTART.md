# An Easy Start Guide to Using Vanilla Gorilla

Vanilla Gorilla is a tool, that while being very powerful and flexibly, should not be too overwhelming to new users. This document will give those with little to no experience in site development or maintenance with the details they need to speed their journey. Given its design; Vanilla Gorilla works best with Agentic Development tools like Antigravity IDE (by Google) or you can use your favorite editor and the AI coding tools to complete your tasks.

If you already now how to do something you should be able to easily skip ahead from one step to the next. This is a simplified process and more advanced users may want to adapt the processes to their need (in particular about pushing local changes directly to the remote main branch vs creating branches and requiring pull requests).

**NOTE** We will often refer to **SITENAME** throughout this document. Please substitute the name of the folder you want to use for this project/website. 

## Setup Requirements

The proper operation of Vanilla Gorilla has very specific pre-requirements that we will need you to be certain you have up and running on your computer.

### Terminal program

### Node.js

This is a Node.js-based static site compiler with no other runtime dependencies (no database, no Docker, no browser needed for the build). Because of dependencies of some of the packages that will be installed automatically for you later, we require Node v20.18.1 or newer. Note that npm (Node Package Manger) is installed as part of Node.js.
To install you would issue the following from the terminal app of your computer:

- Windows (via powershell or cmd prompt)
  - `winget install OpenJS.NodeJS.LTS` or if you use nvm `nvm install 20.18.1 && nvm use 20.18.1`
- macOS: 
  - `brew install node` for latest version or `brew install node@20` to meet the minimum requirement
  - if you use nvm instead of brew use: `nvm install 20`
- Linux (Debian/Ubuntu)
  - `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs` for minimum level

### Git client

Git is a version control system that allows you to more easily manage changes to your codebase over time. It is probably the most prevalent VCS today.

- Windows (via powershell or cmd prompt)
  - `winget install --id Git.Git -e --source winget`
- macOS
  - `brew install git` or if you prefer `xcode-select --install`
- Linux (Debian/Ubuntu)
  - `sudo apt update && sudo apt install git`

### GitHub CLI

If you choose to host a copy of your repository (project) remotely, the instructions assume you'll be using GitHub. They offer no-cost private and public repositories. If you use a different provider, then you'll need to adjust any of the instructions below that refer to GitHub but so long as the hosting company supports git, many of the steps below will work accordingly.

- Windows (via powershell or cmd prompt)
  - `winget install --id GitHub.cli`
- macOS
  - `brew install gh`
- Linux (Debian/Ubuntu)
  - `sudo apt update && sudo apt install gh -y`

In order to use your GitHub account to store your repositories, you'll need to
- Verifiy the installation
  - `gh --version`
- Log into your account
  - `gh auth login` this will, in most cases, launch a web browser and walk you through authenticating your account

## Initial Setup for each site

### Create your working folder for this site

The easiest way to create a new site is to run the following command from the terminal of your choice in the folder/directory where the working directory (SITENAME you provide below) will be created:
`npx create-vanilla-gorilla SITENAME`
where SITENAME is the name of the folder/directory to hold your new site. This command will:
- grab the latest version of Vanilla Gorilla
- clone a copy of this into a folder named SITENAME
- setup up a local Git Repository for version control for you 
- provide you with a list of immediate next steps to begin working

### Source Control connections

Vanilla Gorilla will automatically create a local git repository in your site's working directory. If you wish to create a remote repository in your GitHub account, you would follow the following series of steps.

1. Stage and commit your local files (to your local git repo)
`
git add .
git commit -m "chore: initial commit"
`
2. Create and link the private repository on GitHub
`
gh repo create exhibita/SITENAME --private --source=. --remote=origin --push
`
3. If you'd like to make your repository public use the following commands:
`
gh repo create exhibita/breezy.camp --public --source=. --remote=origin --push
`   

## Building and maintaining your site

The process of building out and maintaining your website is to adding/changing/deleting files from the folder created above and then running `npm run build` to compile the site into static HTML. The static HTML/CSS/js site (including all the additional assets) will be built in the /dist folder. Run this command now to ensure all is working as expected.

Once built, you can use a web-browser to open up the index.html file found in the /dist folder to browse the standard site structure. In the blog you'll find some articles that might be important to you as you start planning the build out (or conversion from a static website).

### Design considerations

We have included a [THEMING document](./THEMING.md) in the /docs folder that explains how to adapt an existing design to work with our system. Pay special attention to sections 2 & 3 to understand the process of either creating a new design from scratch or converting from a pre-existing website.

The simplest way to apply your design is the leverage the `design-apply` skill that we've made available to the Agent assisting you. You can call it directly or by inference and it will walk you through the process of the conversion and allows for iterative corrections once the first pass has been approved. Design source input can come from a local sketch, from a local static web page, from a live URL, or from Figma sketch ID or URL.

### Testing your design changes locally

To test your design changes locally, you can either work with the agent to allow for iterative changes that, when displayed, can be approved or redirected as appropriate.

Alternatively you can make changes to the CSS and HTML of your site locally. If you are currently running `npm run watch` the /dist folder will be kept up to date and ready for review locally in a browser. If you are not keeping the watch running just run `npm run build` and view the changes in our browser.

If you are doing your work in an IDE that is based off of VS Code (like Antigravity) you can install the Live Server extension by Ritwick Dey and you can right click to view files in the /dist folder to view your changes on the browser of your choice.

### Git and Remote Repositories In a Nutshell

All of the work you've been doing to this point time is local to your computer. The normal flow after you've been working on changes is to issue the command `git add .` inside of your terminal for the project's working directory/folder. This will stage the files for commitment.

To commit the files that you have staged you would use the command `git commit -m "COMMIT MESSAGE GOES HERE"`. This will store all the changes from the current session in your local git repository history. 

If you have created a remote repository for your code on GitHub, and at its most simplest level, you can push your locally committed changes to the remote main branch using the command `git push origin main`.

Working with Branches locally and remotely (along with Pull Requests) are outside the scope of this document. If you are doing this and don't recall the commands to us, you can always ask your Agent for help (and possibly education) on the matter of local vs remote Git and Branching work off of the **main** branch.

## Deploying your Website to Hosting

Since Vanilla Gorilla's sole purpose is to allow you to quickly and easily create, edit, and manage static Vanilla websites, we've added two features to assist you in with Continuous Deployments by triggering a deployment as soon as you commit changes to the **main** branch of your GitHub (remote) repository. Both of these leverage GitHub actions. In the ./.github/workflows folder you'll find deploy.yml and pages.yml files.

- deploy.yml is designed to trigger an insert (or update) of files and other assets to a site hosted on S3 and using CloudFront (both products of AWS). Please see the blog post about [Choosing Your Hosting Strategy](../src/blog/choosing-your-hosting-strategy/index.md) (or on [our site](https://vg.exhibita.com/blog/choosing-your-hosting-strategy/") if you've cleared the initially loaded blog pages).
- pages.yml is desi9gned to deploy the contents of your site to GitHub hosted sites.
Either of these options will require that you create to:
1. create the initially hosted storage in AWS or GitHub
2. add new Repository environmental variables in your GitHub project's settings under Secrets | Repository Secrets.
3. delete the file for the method you are **NOT** using from the /.github/workflows/ folder

If you like doing it all manually, you can take the contents of the /dist folder and its children, and copy them (via FTP or SCP) to your hosting server of choice.