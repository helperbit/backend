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

./node_modules/.bin/jasmine-node dist/modules/user.auth/
./node_modules/.bin/jasmine-node dist/modules/user.admin/
./node_modules/.bin/jasmine-node dist/modules/user.verify/
./node_modules/.bin/jasmine-node dist/modules/wallet.verify/tests/wallet_verify_spec.js 
#./node_modules/.bin/jasmine-node dist/modules/user.ambassador/
#./node_modules/.bin/jasmine-node dist/modules/user.badge/
#./node_modules/.bin/jasmine-node source/modules/campaign/
#./node_modules/.bin/jasmine-node source/modules/project/
#./node_modules/.bin/jasmine-node source/modules/wallet/
#./node_modules/.bin/jasmine-node dist/modules/wallet.verify/