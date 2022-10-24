const fs = require('fs')

const baseSchema = require("./base-schema.json");
const nftConfig = require("./nft-config.json");
let copyNFTConfig = JSON.parse(JSON.stringify(nftConfig));
const outputDir = 'outputs';

// Step 1: Validate NFT Config
// Collection size must equal the aggregated values listed for each attribute object
// e.g. yellow: 50, red: 30, blue: 15, gold: 5 = 100 (= collection size)
console.log(`\n\n>> Validate NFT config`);
nftConfig.attributes.map((attribute) => {
  let sum = attribute.values.reduce((a, b) => a + b, 0);

  if (sum != nftConfig.size) {
    console.log(
      `Sum of trait values for ${attribute.trait_type} equals ${sum} and doesn't equal collection size of ${nftConfig.size}`
    );
    process.exit(1);
  }
});

// Step 2: Generate metadata to /outputs folder
const NFTs = [];
const numberOfAttributes = nftConfig.attributes.length;

baseSchema.name = nftConfig.name;
baseSchema.creator = nftConfig.creator;
baseSchema.description = nftConfig.description;

for (let j = 0; j < nftConfig.size; j++) {
  const newNFT = JSON.parse(JSON.stringify(baseSchema));

  for (let i = 0; i < numberOfAttributes; i++) {
    let randNumber = Math.floor(
      Math.random() * nftConfig.attributes[i].keys.length
    );

    while (copyNFTConfig.attributes[i].values[randNumber] === 0) {
      randNumber = Math.floor(
        Math.random() * nftConfig.attributes[i].keys.length
      );
    }

    newNFT.attributes.push({
      trait_type: nftConfig.attributes[i].trait_type,
      value: nftConfig.attributes[i].keys[randNumber],
    });

    copyNFTConfig.attributes[i].values[randNumber] -= 1;
  }

  NFTs.push(newNFT);
  const NFTContents = JSON.stringify(newNFT, null, 4);

  fs.writeFile(`${outputDir}/nft${(j + 1)}.json`, NFTContents, err => {
    if (err) {
      throw err
    }
  })
}

// Step 3: Calculate "Rarity Score" and print unordered and ordered list of NFTs
const rarities = [];
let count = 1;
NFTs.forEach(NFT => {
    const traitRarities = [];

    NFT.attributes.map(NFTAttribute => {
        const attributeConfigObject = nftConfig.attributes.find(attribute => attribute.trait_type === NFTAttribute.trait_type);
        const indexOfKey = attributeConfigObject.keys.indexOf(NFTAttribute.value);
        const traitRarity = 1 / (attributeConfigObject.values[indexOfKey] / nftConfig.size)
        traitRarities.push(traitRarity);
    })

    const totalRarity = traitRarities.reduce((a, b) => a + b, 0);
    rarities.push({ rarity: totalRarity, NFT: count});
    count++;
});

rarities.sort((a, b) => (a.rarity - b.rarity));
console.log(rarities);

// Step 3.1: Calculate "Rarity Score normalized by category distribution (Trait Normalization)"
const normalizedRarities = [];
let normalizedCount = 1;
NFTs.forEach(NFT => {
    const traitRarities = [];

    NFT.attributes.map(NFTAttribute => {
        const attributeConfigObject = nftConfig.attributes.find(attribute => attribute.trait_type === NFTAttribute.trait_type);
        const indexOfKey = attributeConfigObject.keys.indexOf(NFTAttribute.value);
        const traitRarity = 1 / (attributeConfigObject.values[indexOfKey] / Math.max(...attributeConfigObject.values))
        traitRarities.push(traitRarity);
    })

    const totalRarity = traitRarities.reduce((a, b) => a + b, 0);
    normalizedRarities.push({ rarity: totalRarity.toFixed(2), NFT: normalizedCount});
    normalizedCount++;
});

normalizedRarities.sort((a, b) => (a.rarity - b.rarity));
console.log(normalizedRarities);