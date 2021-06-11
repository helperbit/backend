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

set -e

echo ./dist/modules/wallet/tests/wallet_p2wsh_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet/tests/wallet_p2wsh_spec.js

echo ./dist/modules/wallet/tests/wallet_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet/tests/wallet_spec.js

echo ./dist/modules/user/tests/user_company_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user/tests/user_company_spec.js

echo ./dist/modules/user/tests/user_npo_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user/tests/user_npo_spec.js

echo ./dist/modules/user/tests/user_municipality_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user/tests/user_municipality_spec.js

echo ./dist/modules/user/tests/user_singleuser_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user/tests/user_singleuser_spec.js

echo ./dist/modules/user/tests/user_language_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user/tests/user_language_spec.js

echo ./dist/modules/proposednpo/tests/proposednpo_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/proposednpo/tests/proposednpo_spec.js

echo ./dist/modules/wallet.multisig/tests/multisig_multitx_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/multisig_multitx_spec.js

# echo ./dist/modules/wallet.multisig/tests/hw_tester_multisig_spec._js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/hw_tester_multisig_spec._js

echo ./dist/modules/wallet.multisig/tests/multisig_notall_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/multisig_notall_spec.js

echo ./dist/modules/wallet.multisig/tests/multisig_p2wsh_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/multisig_p2wsh_spec.js

echo ./dist/modules/wallet.multisig/tests/multisig_refuse_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/multisig_refuse_spec.js

echo ./dist/modules/wallet.multisig/tests/multisig_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.multisig/tests/multisig_spec.js

echo ./dist/modules/donation/tests/donation_gift_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/donation/tests/donation_gift_spec.js

# FAILING
# echo ./dist/modules/donation/tests/donation_multiple_project_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/donation/tests/donation_multiple_project_spec.js

# FAILING
# echo ./dist/modules/donation/tests/donation_event_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/donation/tests/donation_event_spec.js

echo ./dist/modules/campaign/tests/campaign_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/campaign/tests/campaign_spec.js

echo ./dist/modules/campaign/tests/campaign_birthday_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/campaign/tests/campaign_birthday_spec.js

echo ./dist/modules/user.auth/tests/admin_auto_add_after_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.auth/tests/admin_auto_add_after_spec.js

echo ./dist/modules/user.auth/tests/user_ban_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.auth/tests/user_ban_spec.js

echo ./dist/modules/user.auth/tests/admin_auto_add_before_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.auth/tests/admin_auto_add_before_spec.js

echo ./dist/modules/user.auth/tests/auth_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.auth/tests/auth_spec.js

echo ./dist/modules/ror/tests/ror_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/ror/tests/ror_spec.js

echo ./dist/modules/ror/tests/ror_reject_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/ror/tests/ror_reject_spec.js

# echo ./dist/modules/wallet.verify/tests/manual_wallet_verify_multi_spec.js_
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.verify/tests/manual_wallet_verify_multi_spec.js_

echo ./dist/modules/wallet.verify/tests/wallet_verify_single_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.verify/tests/wallet_verify_single_spec.js

echo ./dist/modules/wallet.verify/tests/wallet_verify_multi_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.verify/tests/wallet_verify_multi_spec.js

echo ./dist/modules/wallet.verify/tests/wallet_verify_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/wallet.verify/tests/wallet_verify_spec.js

echo ./dist/modules/user.verify/tests/verify_singleuser_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.verify/tests/verify_singleuser_spec.js

echo ./dist/modules/user.verify/tests/verify_npo_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.verify/tests/verify_npo_spec.js

echo ./dist/modules/user.verify/tests/verify_company_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.verify/tests/verify_company_spec.js

echo ./dist/modules/project/tests/project_listing_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/project/tests/project_listing_spec.js

echo ./dist/modules/project/tests/project_company_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/project/tests/project_company_spec.js

# FAILING
# echo ./dist/modules/project/tests/project_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/project/tests/project_spec.js

# echo ./dist/modules/lightning/tests/lightning_spec.js_
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/lightning/tests/lightning_spec.js_

# TLTT
# echo ./dist/modules/user.ambassador/tests/user_ambassador_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.ambassador/tests/user_ambassador_spec.js

echo ./dist/modules/event/tests/event_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/event/tests/event_spec.js

# echo ./dist/modules/lightning.charitypot/tests/charitypot_testnetinvoice_spec.js_
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/lightning.charitypot/tests/charitypot_testnetinvoice_spec.js_

# echo ./dist/modules/lightning.charitypot/tests/charitypot_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/lightning.charitypot/tests/charitypot_spec.js

echo ./dist/modules/user.admin/tests/user_admin_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.admin/tests/user_admin_spec.js

# TLTT
# echo ./dist/modules/user.badge/tests/user_badge_spec.js
# ./node_modules/.bin/jasmine-node --forceexit ./dist/modules/user.badge/tests/user_badge_spec.js

echo ./dist/modules/blockchain/tests/blockchain_spec.js
./node_modules/.bin/jasmine-node --forceexit ./dist/modules/blockchain/tests/blockchain_spec.js