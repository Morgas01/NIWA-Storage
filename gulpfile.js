let gulp=require("gulp");
let tasks={
	less:function(){
		let less=require("gulp-less");
		Morgas=false;
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
		console.log(merged);
		return fs.writeFile("js/build.js",merged);
	},
};
tasks.build=function()
{
	return gulp.series(tasks.less,tasks.js);
};

module.exports=tasks;