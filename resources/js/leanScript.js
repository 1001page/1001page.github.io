var Tag = AV.Object.extend('Tag');
var Post = AV.Object.extend('Post');
var Comment = AV.Object.extend('Comment');

//查询全部标签
function qryTag(sucFn, failFn){
	var qry = new AV.Query(Tag);
	qry.descending('postNum');
	qry.find().then(function(tags) {
		sucFn(tags);
	}, function(err){
		failFn(err);
	});
}

// 查询最近的文章
function qryPost(sucFn, failFn){
	var qry = new AV.Query(Post);
	qry.descending('updatedTime');
	qry.notEqualTo('isRecycled', true);
	qry.notEqualTo('isArchived', true);
	qry.skip(0);
	qry.limit(10);
	qry.find().then(function(posts){
		sucFn(posts);
	},function(err){
		failFn(err);
	});
}

// 查询标签下的文章
function qryPostByTag(tagId, tagName, sucFn, failFn) {
	if(!tagId){
		var qry = new AV.Query(Post);
		qry.descending('updatedTime');
		qry.limit(40);
		if(tagName === '归档'){
			qry.equalTo('isArchived', true);
			qry.notEqualTo('isRecycled', true);
		}else if(tagName === '回收站'){
			qry.equalTo('isRecycled', true);
		}else if(tagName === '未分类'){
			qry.equalTo('notCatged', true);
			qry.notEqualTo('isRecycled', true);
		}else if(tagName === '全部'){
			qry.notEqualTo('isRecycled', true);
			qry.limit(1000);
		}
		qry.find().then(function(posts){
			sucFn(posts)
		}, function(err){
			failFn(err);
		});
	}else{
		var tag = new Tag();
		tag.id = tagId;
		var qry = AV.Relation.reverseQuery('Post', 'ptRela', tag);
		qry.limit(30);
		qry.descending('updatedTime');
		qry.notEqualTo('isRecycled', true);
		qry.notEqualTo('isArchived', true);
		qry.find().then(function(posts) {
			sucFn(posts);
		}, function(err) {
			failFn(err);
		});
	}
}

/**
 * 创建文章
 */
function createPost(text, html, sucFn, failFn) {
	//标签由双引号包含至多15个非空白字符组成
	var reg = /#\S{1,15}#/g;
	var tagNames = text.match(reg) || [];
	var retTags = [];
	tagNames = $.grep(tagNames, function(elm, i){
		return $.inArray(elm, [ '#归档#', '#回收站#', '#未分类#', '#全部#' ]) < 0
	})
	AV.Promise.as().then(function() {
		var promise = AV.Promise.as();
		// 先处理完全部标签
		$.each(tagNames, function(i, tagName) {
			tagName = tagName.slice(1,-1);
			promise = promise.then(function() {
				var qry = new AV.Query(Tag);
				qry.equalTo('name', tagName);
				return qry.first().then(function(obj) {
					if (obj) {
						obj.set('postNum', obj.get('postNum') + 1);
						return obj.save();
					} else {
						var tag = new Tag();
						tag.set('name', tagName);
						tag.set('postNum', 1);
						log('create tag ' + tagName);
						return tag.save();
					}
				}).then(function(obj) {
					retTags.push(obj);
					return AV.Promise.as();
				});
			});
		});
		return promise;
	}).then(function() {
		console.dir(retTags);
		var post = new Post();
		post.set('text', text);
		post.set('html', html);
		post.set('updatedTime', (new Date()).getTime());
		debugger;
		if(retTags.length == 0){
			retTags = null;
			post.set('notCatged', true);
		}
		post.relation('ptRela').add(retTags);
		return post.save();
	}).then(function(post){
		sucFn(post)
	}, function(err) {
		failFn(err);
	});
}

/**
 * 删除文章，文章会被移动到回收站。
 */
function deletePost(postId, sucFn, failFn){
	var qry = new AV.Query(Post);
	qry.get(postId).then(function(post){
		if(post.get('isRecycled')){
			return AV.Promise.error({message:'回收站的内容站长会处理的~'});
		}else{
			post.set('isRecycled', true);
			post.set('isArchived', false);
			post.set('notCatged', false);
			return post.save();
		}		
	}).then(function(post){
		sucFn();
	}, function(err){
		failFn(err);
	})
}

function archivePost(postId, sucFn, failFn){
	var qry = new AV.Query(Post);
	qry.get(postId).then(function(post){
		post.set('isArchived', true);
		return post.save();		
	}).then(function(post){
		sucFn();
	}, function(err){
		failFn(err);
	});
}

function recovery(postId, sucFn, failFn){
	var qry = new AV.Query(Post);
	qry.get(postId).then(function(post){
		post.set('isRecycled', false);
		return post.save();		
	}).then(function(post){
		sucFn();
	}, function(err){
		failFn(err);
	});
}

function unArchive(postId, sucFn, failFn){
	var qry = new AV.Query(Post);
	qry.get(postId).then(function(post){
		post.set('isArchived', false);
		return post.save();		
	}).then(function(post){
		sucFn();
	}, function(err){
		failFn(err);
	});
}



var debugOn = true;
function logErr(msg, error) {
	if (debugOn && console && console.error) {
		console.error(msg + "\nError code: " + error.code + "\nError message: " + error.message);
	}
}
function log(msg){
	if(debugOn && console && console.log){
		console.log(msg);
	}
}