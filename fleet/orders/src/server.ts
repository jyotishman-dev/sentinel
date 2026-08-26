import { configDotenv } from "dotenv"
import app from "./app.js";


configDotenv()


const PORT  =  process.env.PORT || 4002;




app.listen(PORT , ()=> {
       console.log(`App listening on PORT ${PORT}`)
})