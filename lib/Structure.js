(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		NodePatch:"NodePatch",
		remove:"array.remove"
	});
	
	let Structure=µ.Class({
		[µ.Class.symbols.abstract]:function(type)
		{
			if(typeof type==="string") type={type:type};
			return type;
		},
		[µ.Class.symbols.onExtend]:function(sub)
		{
			if(!sub.prototype.type) throw new Error("#Structure:001 type is not defined");
			if(sub.prototype.type in Structure) throw new Error("#Structure:002 type is not unique");

			Structure[sub.prototype.type]=sub;
			if(!sub.fromJSON) sub.fromJSON=function defaultDeserializer (json){return new sub(json)};
		},
		constructor:function({name,atime,mtime})
		{
			new SC.NodePatch(this);

			this.type=this.type; //static type to instance

			this.name=name;
			this.atime=atime;
			this.mtime=mtime;
		},
		getPath:function()
		{
			let path=[];
			for(let step=this;step.parent!=null;step=step.parent)
			{
				path.unshift(step.name);
			}
			return path;
		},
		toJSON:function()
		{
			return new Proxy(this,{
				ownKeys:function(target) //sort keys for readability
				{
					let keys=Object.keys(target);
					SC.remove(keys,"parent");
					if(target.children.length===0) SC.remove(keys,"children");

					return keys;
				}
			});
		}
	});

	Structure.fromJSON=function(json)
	{
		if(!json.type) throw new Error("#Structure:003 no type");
		if(!(json.type in Structure)) throw new Error("#Structure:004 unknown type "+json.type);
		let rtn=Structure[json.type].fromJSON(json);
		if(json.children)
		{
			for(let child of json.children)
			{
				rtn.addChild(Structure.fromJSON(child));
			}
		}
		return rtn;
	};

	SMOD("Structure",Structure);
	
	if(typeof module!="undefined") module.exports=Structure;

	µ.Class(Structure,{
		type:"Directory",
		constructor:function(param)
		{
			this.mega(param);

			Object.defineProperty(this,"size",{
				enumerable: false,
				configurable: true,
				get:()=>
				{
					return Array.from(this.children).reduce((sum,child)=>sum+(child.size||0),0);
				}
			});
		}
	});

	µ.Class(Structure,{
		type:"File",
		constructor:function(param)
		{
			this.mega(param);

			this.size=param.size;
			this.hash=param.hash||{};
			this.lastCheck=param.lastCheck||null;
		}
	});
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);