let gulp=require("gulp");
let tasks={
	less:function(){
		let less=require("gulp-less");
		require("morgas");
		return gulp.src('less/index.less')
		.pipe(less({
			paths: [ require("morgas.gui").lessFolder ]
		}))
		.pipe(gulp.dest('css'));
	},
	async js()
	{
		require("morgas");
		let DependencyManager=µ.getModule("DependencyManager");
		let manager=new DependencyManager();
		manager.addSources(["js","lib"]);

		let gui=require("morgas.gui");
		manager.addPackage({
			name:"morgas.gui",
			basePath:gui.dirname,
			moduleDependencies:µ.getModule("Morgas.gui.ModuleDependencies"),
			moduleRegister:µ.getModule("Morgas.gui.ModuleRegister")
		});

		let files=await manager.resolve("js/index.js");
		let fs=require("fs").promises;
		let contents=await Promise.all(files.map(f=>fs.readFile(f,"utf8")));
		merged=contents.join("\n/********************/\n");

		return fs.writeFile("build.js",merged);
	},
};
tasks.build=gulp.parallel(tasks.less,tasks.js);

tasks.watch=function()
{
	gulp.watch('less/index.less',{cwd: __dirname, ignoreInitial: false},tasks.less);
	gulp.watch(["js//*.js","lib//*.js",],{cwd: __dirname, ignoreInitial: false},tasks.js);
};

module.exports=tasks;