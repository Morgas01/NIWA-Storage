require("morgas");
(function(µ,SMOD,GMOD,HMOD,SC){

	let gui=require("morgas.gui");
	let Concat=require("concat-with-sourcemaps");

	SC=SC({
		dependencyParser:require.bind(null,"morgas/lib/dependencyParser"),
		morgasModuleRegister:"Morgas.ModuleRegister",
		morgasModuleDependencies:"Morgas.ModuleDependencies",
		morgasGuiModuleRegister:"Morgas.gui.ModuleRegister",
		morgasGuiModuleDependencies:"Morgas.gui.ModuleDependencies",
		DependencyResolver:"DepRes",
		File:"File",
		uniquify:"uniquify"
	});

	let normalizePath=function(path){return path.replace(/\\/g,"/");};
	let morgasJsFile=normalizePath(new SC.File(µ.dirname).changePath("Morgas.js").getAbsolutePath());


	module.exports=function(files,relativeTo)
	{
		relativeTo=SC.File.stringToFile(relativeTo);

		let replaceDirs=[
			[normalizePath(relativeTo.getAbsolutePath()),"."],
			[normalizePath(µ.dirname)+"/","/morgas/"],
			[normalizePath(gui.dirname)+"/","/morgas/gui/"]
		];

		let resouceMap=new Map();

		let parser=(new SC.dependencyParser()).addSources(files)
			.addModuleRegister(SC.morgasModuleRegister,µ.dirname).addModuleDependencies(SC.morgasModuleDependencies,µ.dirname)
			.addModuleRegister(SC.morgasGuiModuleRegister,gui.dirname).addModuleDependencies(SC.morgasGuiModuleDependencies,gui.dirname);

		let getFile=function(path)
		{
			if(resouceMap.has(path))//TODO fix or remove
			{
				path=path.slice();
				path=resouceMap.get(path);
			}
			return relativeTo.clone().changePath(path);
		};

		let resolveFile=function(parseResults,filepath)
		{
			let toResolve;
			let isConsumer=(filepath in parseResults.consumingDependencies);
			if(isConsumer)
			{
				let dependencies=parseResults.consumingDependencies[filepath];
				toResolve=dependencies.uses.concat(dependencies.deps);
			}
			else
			{
				toResolve=Object.entries(parseResults.moduleRegister)
					.filter(([module,modulePath])=>modulePath===filepath)
					.map(([module])=>module);
			}
			let resolver=new SC.DependencyResolver(parseResults.moduleDependencies);
			let modules=resolver.resolve(toResolve);
			let files=SC.uniquify(modules.map(key=>parseResults.moduleRegister[key]));
			files.unshift(morgasJsFile);
			return files;
		};

		let resourceCounter=0;
		return {
			get(path,sourceMaps=true)
			{
				let file=getFile(path);
				return file.exists()
				.then(function()
				{
					return parser.parse()
					.then(function(result)
					{
						let filepath=normalizePath(file.getAbsolutePath());
						let files=resolveFile(result,filepath);
						let isConsumer=(filepath in result.consumingDependencies);
						if(isConsumer) files.push(filepath);
						return Promise.all(files.map(f=>SC.File.stringToFile(f).read().then(data=>[f,data])))
						.then(function(fileContents)
						{
							let concat=new Concat(true,path,"\n/********************/\n");
							for (let [name,data] of fileContents)
							{
								let replaced=false;
								for(let[filepath,replacement] of replaceDirs)
								{
									if(name.startsWith(filepath))
									{
										name=name.replace(filepath,replacement);
										replaced=true;
										break;
									}
								}
								if(!replaced)
								{
									for(let[replacement,filepath] of resouceMap)
									{
										if(name.startsWith(filepath))
										{
											name=name.replace(filepath,replacement);
											break;
										}
									}
								}
								name;
								concat.add(name,data);
							}
							if(sourceMaps)
							{
								return concat.content + "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," + Buffer.from(concat.sourceMap).toString("base64");
							}
							else
							{
								return concat.content;
							}
						});
					});
				}/*,()=>
				{
					param.status=404;
					return param.path+" NOT FOUND";
				}*/);
			},
			/**
			 *
			 * @param {String[],String} [paths]
			 * @returns {*|PromiseLike<T>|Promise<T>}
			 */
			getDependencies(paths)
			{
				return parser.parse()
				.then(function(rtn)
				{
					if(paths)
					{
						let files=[].concat(paths)
							.map(f=>normalizePath(getFile(f.split("/")).getAbsolutePath()))
							.map(f=>resolveFile(rtn,f));
						rtn.order=files;
					}
					return rtn;
				});
			},
			addResource(moduleRegister, moduleDependencies, directory, name)
			{
				if (!directory) throw "no directory";
				directory = SC.File.stringToFile(directory);
				if (moduleRegister) parser.addModuleRegister(moduleRegister, directory);
				parser.addModuleDependencies(moduleDependencies, directory);

				if (!name) name = "resource_" + (resourceCounter++);
				if (resouceMap.has(name))
				{
					µ.logger.warn(`resource name "${name}" already in use`);
					name += "_" + (resourceCounter++);
				}
				resouceMap.set(name, normalizePath(directory.getAbsolutePath()));
			}
		};
	}

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);