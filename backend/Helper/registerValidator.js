const joi =require("joi");
const registerValidator=joi.object({
    email:joi.string().email().required(),
    password:joi.string().min(4).pattern(
        // new RegExp("^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$")
        new RegExp("^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,}$")
    ).required(),
});
module.exports=registerValidator;