import { configDotenv } from "dotenv"
import app from "./app.js";


configDotenv()


const PORT  =  process.env.PORT || 4001;




app.listen(PORT , ()=> {
       console.log(`App listening on PORT ${PORT}`)
})