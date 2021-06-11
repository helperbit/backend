__='
   Helperbit: a p2p donation platform (backend)
   Copyright (C) 2016-2021  Davide Gessa (gessadavide@gmail.com)
   Copyright (C) 2016-2021  Helperbit team
   
   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>
'

git stash
git pull
echo "{\"name\": \"` echo $1 `\"}" > source/env.json
npm install
echo 'Generating token key...'
#bash scripts/generate_key.sh
npm run build
#node ./node_modules/babel-cli/bin/babel ./ --out-dir ./ --ignore ./node_modules/
echo 'Stopping backend and backendjob services...'
sudo systemctl stop helperbit-backend-` echo $1 `
sudo systemctl stop helperbit-backendjob-` echo $1 `
echo 'Starting backend and backendjob service...'
sudo systemctl start helperbit-backend-` echo $1 `
sudo systemctl start helperbit-backendjob-` echo $1 `
telegram-send "$1 backend deployed: `git rev-parse HEAD`"