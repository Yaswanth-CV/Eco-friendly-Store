const {mongoose} = require('mongoose')

const dbConnect = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URI)
        console.log('DB connected')
    } catch(e){
        console.log(`Error: ${e}`)
    }
}

module.exports = dbConnect