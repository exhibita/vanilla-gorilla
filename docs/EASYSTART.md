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

Note that in initial testing using our favorite AI coding tools, we were able to get them to do the initial heavy lifting on this. This is an example of a prompt that was successful in doing the work for us (assuming that the AI converstion is started in or has the working directory attached to it):
> Using the docs/THEMING.md in this repository, I'd like you to look at the style used in the static html files found at c:\users\micha\DOcuments\Repos\ExhibitA\Breezy.camp\scraped-site\index.html and apply the transformations found in the THEMING doc (paying special attention to the required css and html elements) to create the CSS, skeleton, and template files in this folder. You may overwrite the exiting index.html, css, and template/skeleton files to apply this new design to this site to be built with Vanilla Gorilla static site generation system.

Of course, your mileage and tool set may vary so play around with the wording and/or prompt to best suit your needs.

### Testing your design changes locally

blah, blah, blah

### Pushing your changes to your remote repository

blah, blah, blah

## Deploying your Website to Hosting

blah, blah, blah