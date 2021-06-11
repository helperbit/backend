import frisby = require('frisby');
import common = require('../../tests.shared/middlewares/common');
import userMW = require('../../tests.shared/middlewares/user');
import walletMW = require('../../tests.shared/middlewares/wallet');
import { frisbyChain } from '../../tests.shared/middlewares/frisbyChain';


frisbyChain({}, [
	common.cleanResources('testmultisignhwtester'),

	
	userMW.createAdmins('testmultisignhwtester'),
	(data, next) => {
		data.adminob[2].skipsign = true;

		return next({
			username: 'testmultisignhwtester_msmaster',
			usertype: 'npo',
			admins: data.admins,
			adminob: data.adminob
		});
	},
	
	/* Create NPO */
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	userMW.verifyFake,
	userMW.geolocalizeAsAffected,

	/* Add admins */
	userMW.addAdmins,

	/* Create wallet and feed multisigs */
	walletMW.createMultisig,
	walletMW.feedMultisig,

	/* Get wallet */
	function (data, next) {
		frisby.create('/wallet - get multisig wallets')
			.get(common.api + 'wallet')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSONTypes({ wallets: Array })
			.expectJSON('wallets.*', { multisig: { active: true } })
			.retry(50000, 5000)
			.afterJSON(function (json) {
				data.address = json.wallets[0].address;
				next(data);
			})
			.toss();
	},

	/* Get a faucet */
	walletMW.getWallet,
	walletMW.balance,

	/* Create a withdraw */
	function (data, next) {
		frisby.create('/wallet/:address/withdraw - request a withdraw EW1')
			.post(common.api + 'wallet/' + data.address + '/withdraw',
				{
					"value": 0.005,
					"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
					"fee": 0.00038
				}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(500).expectJSON({ error: 'EW1' })
			.afterJSON(function (json) { next(data); })
			.toss();
	},

	walletMW.faucet,
	walletMW.balance,
	walletMW.withdrawFee,

	function (data, next) {
		frisby.create('/wallet/:address/withdraw - request a withdraw')
			.post(common.api + 'wallet/' + data.address + '/withdraw',
				{
					"value": data.unconfirmed + data.balance - data.fees,
					"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
					"fee": data.fees,
					"description": "Invio fondi per pagare il frontendista"
				}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(json => {
				next(data);
			})
			.toss();
	},

	/* Sign multisig withdraw */
	walletMW.signMultisig
]);



