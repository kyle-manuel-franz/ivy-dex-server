const { initializeMongoDbConnection } = require('../../src/lib/mongoose');
const tokenModel = require('../../src/data/tokens/model')
const fs = require('fs');
const path = require('path');

(async () => {
    const db = await initializeMongoDbConnection()

    const data = fs.readFileSync(path.join(__dirname, '../../env/data/testnet-tokens.json')).toString()
    const tokenJSON = JSON.parse(data)

    await tokenModel.deleteMany();


    for(let i = 0; i < tokenJSON.length; i++){
        const t = tokenJSON[i]
        const token = new tokenModel({
            policyId: t.policyId,
            tokenName: t.tokenName,
            tokenNameUtf: t.tokenNameUtf,
            asset: t.asset,
            fingerprint: t.fingerprint,
            quantity: t.quantity,
            metadata: t.metadata
        })

        try {
            await token.save()
        } catch (e){
            if(e.code === 11000){
                console.log(e)
            } else {
                throw e
            }
        }
    }

    db.close()
})();