import { crocodileAPIContract } from './crocodile_service/objects/Crocodile.js'
import { crocodileListAPIcontract } from './crocodile_service/endpoints/croc_list.js'

console.log(JSON.stringify(crocodileAPIContract))
console.log(JSON.stringify(crocodileListAPIcontract))

export {
  crocodileAPIContract,
  crocodileListAPIcontract,
}