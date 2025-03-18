<!--
    Instructions:

    Do a find replace with the follow:
    
        <!-- TODO: PROJECT_NAME --/> TO "YOUR PROJECTS NAME" (ie Go SDK)
        <!-- TODO: PROJECT_REPO_NAME --/> TO "YOUR REPO NAME" (ie deepgram-js-sdk)
        <!-- TODO: LANGUAGE --/> TO "THE PROGRAMMING LANGAUGE" (ie Go)

    Search for any other `<!-- TODO:` (without the `) and provide any details you might want to include.
    These TODOs are usually project specific things, so you will need to either fill the placeholder out or delete it.

    Then delete this comment from the top of this file.
-->

# Branch and Release Process

- [Branch and Release Process](#branch-and-release-process)
  - [Branching Process](#branching-process)
    - [Branching Methods](#branching-methods)
    - [Branch Process for This Project](#branch-process-for-this-project)
      - [Why Pick This Strategy?](#why-pick-this-strategy)
  - [Release Process](#release-process)

## Branching Process

In software development, selecting an appropriate Git branch strategy is crucial for maintaining code integrity, fostering collaboration, and streamlining project management. A well-defined branch strategy helps teams manage code changes systematically, reducing the risk of conflicts and ensuring that features, bug fixes, and releases are properly isolated.

## Branching Methods

For open-source projects, three popular Git branching strategies are:

1. **Git Flow**:

   Git Flow is a robust branching strategy that uses multiple branches for feature development, releases, and hotfixes. The primary branches include:

   - `main`: Holds the production-ready code.
   - `develop`: Integrates all completed features and serves as the staging area for the next release.
   - `feature/*`: Branches off from `develop` for new features.
   - `release/*`: Branches off from `develop` when preparing a new release.
   - `hotfix/*`: Branches off from `main` for critical fixes that need to be deployed immediately.

   Git Flow is suitable for projects with regular release cycles and helps maintain a clear and structured workflow.

2. **GitHub Flow**:

   GitHub Flow is a simpler, more streamlined approach ideal for projects that deploy frequently. Its key principles include:

   - A single `main` branch always containing deployable code.
   - Branches for each feature or bug fix that branch off from `main` and merge back into `main` upon completion.
   - Continuous deployment from the `main` branch, allowing for fast iterations and rapid delivery of new features.

   This strategy emphasizes simplicity and continuous integration, making it well-suited for fast-paced development environments.

3. **Trunk-Based Development**:

   Trunk-Based Development focuses on keeping a single, stable branch (the "trunk") where all developers commit their code. Key practices include:

   - Small, frequent commits directly to the `main` branch.
   - Short-lived feature branches that are quickly merged back into `main`.
   - Emphasis on automated testing and continuous integration to ensure code stability.
   This strategy aims to minimize merge conflicts and maintain a high level of code quality, promoting rapid feedback and collaboration.

Each of these strategies has its own strengths and is chosen based on the specific needs and workflow of the project.

## Branch Process for This Project

<!-- TODO:

    Setting Up Your Project Specific Branch Strategy

    Fill out this section by:

    - Pick one of the options above and maybe provide why you chose this method
    - Define alternate one not in this list and maybe provide why this is better suited for your project

-->

### Why Pick This Strategy?

<!-- TODO:

    (Optionally, provide thoughts on why you picked this strategy)

-->

## Release Process

<!-- TODO:

    Setting Up Your Project Specific Release Strategy

    Fill out this section by:

    - Pick one of the options above and maybe provide why you chose this method
    - Define alternate one not in this list and maybe provide why this is better suited for your project

-->
