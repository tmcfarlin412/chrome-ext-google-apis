# Chrome Extension Core README

This program is named "Chrome Extension Core"

## Copyright Notice

Copyright 2018 Gerald McFarlin

This file is part of "Chrome Extension Core"

"Chrome Extension Core" is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

"Chrome Extension Core" is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with "Chrome Extension Core".  If not, see <https://www.gnu.org/licenses/>.

## INSTALLATION

- In the manifest.js, add the following:

    "background": {
        "scripts": [
            "/libs/chrome-ext-core/Core.js",
            "/libs/chrome-ext-core/background.js",
            ...
        ]
    }

- Include "Core.js" wherever you need it.
- Set constants
  - Core.IS_CONTENT_SCRIPT: true by default. whether the environment is a content script. If so, need to request the auth token from the background script.
- Install all dependencies (see section DEPENDENCIES)

## DEPENDENCIES

Be sure to install and run all dependencies prior to initiating "Chrome Extension Core".

- There are no dependencies at this time