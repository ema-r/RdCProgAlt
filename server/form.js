var mongoose=require("mongoose");

var formSchema=new mongoose.Schema({
	songUrl : String
});

module.exports=mongoose.model("Form",formSchema);
