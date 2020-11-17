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
		let fs=require("fs").promises;
		let manager=require("./buildTools/dependencyManager")(["js","lib"]);

		let merged=await manager.get("js/index.js");
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