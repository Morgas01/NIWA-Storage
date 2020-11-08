let dependencManager=module.exports=µ.getModule("dependencyManager")(["js","lib"],"js");
let gui=require("morgas.gui");
dependencManager.addResource(µ.getModule("Morgas.gui.ModuleRegister"),µ.getModule("Morgas.gui.ModuleDependencies"),gui.dirname,"morgas.gui");
