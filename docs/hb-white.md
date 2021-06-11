Helperbit: transparency as a service
====================================

Helperbit provides a transparent solution that help user in the donation process
for catastrofic events. These donations flows are trasparent, which implies that
all donations are stored in an immutable public ledger (the Bitcoin blockchain).

We offer a secure walleting system where users are the only owner of your money
and donations, using bitcoin multisig feature. [1] [2]

We achieve the transparency in different ways:
- Using a public ledger to track transactions
- Embedding informations on donations [3]
- User provably fair obfuscation [5]



Walleting
---------

Single users walleting system use 2of3 multisig wallets. Each single user wallet is composed of 3 keys:

- One key is owned by the user, represented as a bip39 mnemonic
- One backup key is owned by the user, represented as AES encrypted JSON file
- One key is owned by Helperbit

The creation process is the following:

1. The user generate two client side keys; one is a mnemonic and the second is
	an encrypted key downloaded in the user computer
2. The two public keys are sent to helperbit, that produce a third key, and finalize
	the wallet creation.

When an user want to use his funds, he creates a transaction signed with
its key; then, the incomplete transaction is sent to helperbit that apply its signature
and broadcast the transaction.

This multisig model described before assures that:

- Helperbit can't move your funds
- If Helperbit is unanviable, the user can still use his funds by using his 2 private keys
- If the user lost the mnemonic, it can still move his funds by using the encrypted backup file



Walleting for organizations
---------------------------

The walleting system for organization is quite different from the singleusers, even
if it uses the same security scheme of them.

Wallet for organizations should handle the fact that usually an organization is managed by
many people so giving the wallet access to only one user could be problematic
for many reasons (person die, thief, lost credentials).

To mitigate these problem, an organization wallet creation follow this flow:

1. The organization declares who are the admins (single users on Helperbit) that
	will be able to interact with the organization
2. The organization starts the wallet creation process, declaring which admin
	chan handle this new wallet, and how many admins are required to create a 
	transaction; for example 3 admins A,B,C, and at least 2 signatures are required
	for a transaction.
3. Each admin receives an email with a link for the creation of their part of the wallet;
	the admin open the link, produce a mnemonic, and feed its publickey to the organization
	wallet. (This action is called "wallet feeding"
4. After that, each admin has feeded their part of the key and the new wallet is created
	and ready to receive donations.


When an organization want to spend their money, should follow this flow:

1. The organization create a new transaction request where it specifies the amount, the
	destination, and a small description of the transaction.
2. Each admin receives an email with a link to sign the transaction; the admin goes in helperbit,
	select the transaction, and if he want, he sign the transaction with its mnemonic.
3. After that the minimum number of signature is reached, the transaction is broadcasted in the
	Bitcoin network.

Let's analyze which are the benefits of this choice:

1. A single admin can't stole organization money
2. When an admin disappear, there're other n-1 admins that can sign a transaction
3. Helperbit can't handle organizations money

For backup purpose, organization wallets has one additional key stored offline, that could be used
if more than one admin disappear.

A future backup method will use timelocks approach to avoid the helperbit backup key, maintaining the
possibility to reedem funds of lost accounts.



Proof of Donation
-----------------


