//加载标签
function loadTag() {
	qryTag(function(tags) {
		var preDefTags = [ '归档', '回收站', '未分类', '全部' ];
		var $tagPanelContent = $('#tagPanelContent').empty();
		var tagElmTmpl = $('#tagTempl').clone().removeAttr('id');
		for (var i = 0; i < tags.length; i++) {
			var tagName = tags[i].get('name');
			if ($.inArray(tagName, preDefTags) < 0) {
				tagElmTmpl.clone().text(tagName).data('tagId', tags[i].id).appendTo($tagPanelContent);
			}
		}
		var $preDefTagsPanel = $('<div></div>').appendTo($tagPanelContent);
		for (var i = 0; i < preDefTags.length; i++) {
			tagElmTmpl.clone().text(preDefTags[i]).appendTo($preDefTagsPanel);
		}
		$tagPanelContent.appendTo('#tagPanel');
	}, function(err) {
		alert('加载标签失败. \n' + err.message);
	});
};

// 加载初始文章
function loadPost() {
	qryPost(function(posts) {
		showPosts(posts);
	}, function(err) {
		alert('加载文章失败 \n' + err.message);
	});
}

// 添加文章到页面
function showPosts(posts) {
	$('#postList').empty();
	if (!posts || posts.length == 0) {
		$('#newPostItem').addClass('bottom-radius');
		return;
	} else {
		$('#newPostItem').removeClass('bottom-radius');
	}
	var $postListParent = $('#postList').parent();
	var $postList = $('#postList').detach();
	var postItemTemp = $('#postItemTempl').clone().removeAttr('id');
	for (var i = 0; i < posts.length; i++) {
		var post = posts[i];
		var postInfo = makePostInfo(post);
		var postElm = postItemTemp.clone().data('postId', posts[i].id).data('postInfo', postInfo).appendTo($postList);
		postElm.find('.post-box-container').html(posts[i].get('html'));
		if (i == 0) {// 标记第一个post
			postElm.addClass('first-post-item');
		}
		if (i == posts.length - 1) {// 最后一篇post,有可能也是第一个post.
			postElm.addClass('last-post-item');
		}
	}
	$postList.appendTo($postListParent);
}

/*
 * 新增评论
 */
function createComment(text, html, postId, succeedFn) {
	var comment = new Comment();
	comment.set('text', text);
	comment.set('html', html);
	comment.set('postId', postId);
	comment.set('createdTime', (new Date()).getTime());
	comment.save(null).then(function(comment) {
		succeedFn(comment.id);
	}, function(comment, error) {
		logErr('save comment error ', error);
	});
}

/*
 * 加载文章下的全部评论
 */
function queryComment(postId, succeedFn, failedFn) {
	var qry = new AV.Query(Comment);
	qry.equalTo('postId', postId);
	qry.find().then(function(results) {
		succeedFn(results);
	}, function(error) {
		failedFn(error);
	})
}

/*
 * 删除评论
 */
function deleteComment(commentId, succeedFn, failedFn) {
	var qry = new AV.Query(Comment);
	qry.get(commentId).then(function(comment) {
		return comment.destroy();
	}, function(object, error) {
		logErr('query comment failed');
	}).then(function(post) {
		succeedFn();
	}, function(object, error) {
		failedFn(object, error);
	})
}

function makePostInfo(post) {
	return {
		postId : post.id,
		isArchived : post.get('isArchived'),
		isRecycled : post.get('isRecycled'),
		notCatged : post.get('notCatged')
	};
}

function isBoxEmpty(box) {
	var text = $(box).text();
	var html = $(box).html();
	/* text.trim() === "" && */
	if (text === "" && html.indexOf('<img') < 0 && html.indexOf('<audio') < 0 && html.indexOf('<video') < 0) {
		return true;
	} else {
		return false;
	}
}

function getPostInfo(elm) {
	return $(elm).closest('.post-item').data('postInfo');
}
function getPostId(elm) {
	return getPostInfo(elm).postId;
}
function getPostBox(elm) {
	return $(elm).closest('.post-item').find('.post-box');
}
function getCommentList(elm) {
	return $(elm).closest('.post-item').find('.comment-list');
}
function getCommentId(elm) {
	return $(elm).closest('.comment-item').data('commentId');
}

// 注册页面元素事件
function registUIiEventHandle() {

	$('#tagPanel').on({
		click : function() {
			qryPostByTag($(this).data('tagId'), $(this).text(), function(posts) {
				showPosts(posts);
			}, function(err) {
				alert('查询文章失败\n' + err.message);
			});
		}
	}, ".tag");

	$('#newPostItem .placeholder').click(function() {
		$(this).addClass('hide');
		$('#newPostItem .editArea').removeClass('hide');
		$('#postList .post-item').addClass('opacity01');
		var newPostBox = $('#newPostItem .post-box').removeClass('top-radius').focus();
		if (!newPostBox.data('ckeditor')) {
			newPostBox.ckeditor();
		}
	});

	$('#newPostItem .post-box').keyup(function(e) {
		if (isBoxEmpty(this)) {
			$('#createPostBtn').prop('disabled', true);
		} else {
			$('#createPostBtn').prop('disabled', false);
			if (e.ctrlKey && e.which == 13) {
				$('#createPostBtn').click();
			}
		}
		if (e.which == 27) {
			$('#cancelPostBtn').click();
		}
	});

	$('#createPostBtn').click(
			function() {
				$(this).text('正在保存');
				var containerElm = $('#newPostBoxContainer').clone().children().attr('contentEditable', 'false').removeClass('top-radius').end();
				containerElm.find('span.cke_reset.cke_widget_drag_handler_container').remove();
				containerElm.find('img.cke_reset.cke_widget_mask').remove();
				createPost(containerElm.text(), containerElm.html(), function(post) {
					$('#newPostItem .editArea').addClass('hide');
					$('#newPostItem .placeholder').removeClass('hide');
					$('#createPostBtn').text('保存');
					$('#newPostItem .post-box').html('').blur();
					$('#postList .post-item').removeClass('opacity01');
					var postInfo = makePostInfo(post);
					$('#postItemTempl').clone().removeAttr('id').data('postInfo', postInfo).data('postId', post.id).prependTo('#postList').find('.post-box-container').html(
							containerElm.html());
					loadTag();
				}, function(err) {
					alert('创建文章失败\n' + err.message);
				});
			});

	$('#cancelPostBtn').click(function() {
		$('#newPostItem .editArea').addClass('hide');
		$('#newPostItem .placeholder').removeClass('hide');
		$('#newPostItem .post-box').addClass('top-radius');
		$('#postList .post-item').removeClass('opacity01');
	});

	$('#postList').on(
			{
				click : function() {
					var _this = this;
					$(this).parent().next().toggleClass('hide');
					if ($(this).data('queryed')) {
						return;
					}
					var postId = queryComment(getPostId(this), function(comments) {
						$(_this).data('queryed', true);
						var commentList = getCommentList(_this);
						for (var i = 0; i < comments.length; i++) {
							var commentId = comments[i].id;
							var html = comments[i].get('html');
							$('#commentItemTempl').clone().removeAttr('id').data('commentId', comments[i].id).find('.comment-box-container').html(comments[i].get('html')).end()
									.appendTo(commentList);
						}
					}, function(error) {
						logErr('query comments failed.', error);
					});
				}
			}, 'span.comment');

	$('#postList').on({
		click : function() {
			alert('该功能尚未开发完成.');
		}
	}, 'span.edit');

	$('#postList').on({
		click : function() {
			var _this = this;
			if (confirm('您确定要删除吗')) {
				deletePost(getPostId(this), function() {
					$(_this).closest('.post-item').remove();
				}, function(err) {
					alert('删除文章失败 \n' + err.message);
				})
			}
		}
	}, 'span.delete');

	$('#postList').on({
		click : function() {
			var _this = this;
			recovery(getPostId(this), function() {
				$(_this).closest('.post-item').remove();
			}, function(err) {
				alert('还原文章失败 \n' + err.message);
			})
		}
	}, 'span.recovery');

	$('#postList').on({
		click : function() {
			var _this = this;
			unArchive(getPostId(this), function() {
				$(_this).closest('.post-item').remove();
			}, function(err) {
				alert('取消归档失败 \n' + err.message);
			})
		}
	}, 'span.unArchive');

	$('#postList').on({
		click : function() {
			var _this = this;
			archivePost(getPostId(this), function() {
				$(_this).closest('.post-item').remove();
			}, function(err) {
				alert('归档文章失败 \n' + err.message);
			})
		}
	}, 'span.archive');

	$('#postList').on({
		click : function() {
			var $postInfo = $(this).closest('.post-info');
			var expanded = !$(this).data('expanded');
			$(this).data('expanded', expanded);
			if (expanded) {
				$postInfo.find('.updatedDate').removeClass('hide');
				$postInfo.find('.delete').removeClass('hide');
				$postInfo.find('.edit').removeClass('hide');
				$postInfo.find('.comment').removeClass('hide');
				$postInfo.find('.archive').removeClass('hide');
				if (getPostInfo(this).isRecycled) {
					$postInfo.find('.recovery').removeClass('hide');
					$postInfo.find('.archive').addClass('hide');
				}
				if (getPostInfo(this).isArchived) {
					$postInfo.find('.archive').addClass('hide');
					$postInfo.find('.unArchive').removeClass('hide');
				}

			} else {
				$postInfo.find('.updatedDate').addClass('hide');
				$postInfo.find('.delete').addClass('hide');
				$postInfo.find('.edit').addClass('hide');
				$postInfo.find('.comment').addClass('hide');
				$postInfo.find('.archive').addClass('hide');
				$postInfo.find('.recovery').addClass('hide');
				$postInfo.find('.unArchive').addClass('hide');
			}

		}
	}, 'span.more');

	$('#postList').on({
		click : function() {
			$(this).addClass('hide');
			$(this).closest('.new-comment-item').find('.editArea').removeClass('hide').find('.comment-box').focus();
		}
	}, '.new-comment-item .placeholder');

	$('#postList').on({
		keyup : function(e) {
			var createCommentBtn = $(this).closest('.post-item').find('.create-comment-btn');
			if (isBoxEmpty(this)) {
				createCommentBtn.prop('disabled', true);
			} else {
				createCommentBtn.prop('disabled', false);
				if (e.ctrlKey && e.which == 13) {
					createCommentBtn.click();
				}
			}
			// Esc
			if (e.which == 27) {
				$(this).closest('.new-comment-item').find('.cancel-comment-btn').click();
			}
		}
	}, '.new-comment-item .comment-box');

	// 新增评论
	$('#postList').on({
		click : function() {
			var btn = $(this).text('正在保存');
			var commentList = $(this).closest('.post-item').find('.comment-list');
			var postId = $(this).closest('.post-item').data('postId');
			var containerElm = $(this).closest('.new-comment-item').find('.comment-box-container').clone();
			containerElm.find('.comment-box').attr('contentEditable', false);
			createComment(containerElm.text(), containerElm.html(), postId, function(commentId) {
				var commentItemClone = $('#commentItemTempl').clone().removeAttr('id').data('commentId', commentId).appendTo(commentList);
				commentItemClone.find('.comment-box-container').html(containerElm.html());
				btn.text('保存').prop('disabled', true);
				btn.closest('.new-comment-item').find('.comment-box').html('');
				btn.closest('.new-comment-item').find('.cancel-comment-btn').click();
			});
		}
	}, '.create-comment-btn');

	// 取消编辑评论
	$('#postList').on({
		click : function() {
			$(this).closest('.new-comment-item').find('.editArea').addClass('hide');
			$(this).closest('.new-comment-item').find('.placeholder').removeClass('hide');
		}
	}, '.cancel-comment-btn');

	$('#postList').on({
		click : function() {
			$(this).closest('.comment-item').find('.comment-date').toggleClass('hide');
		}
	}, '.comment-item .comment-box');

	$('#postList').on({
		click : function() {

			var _this = this;
			if (confirm('您确定要删除评论吗')) {
				deleteComment(getCommentId(this), function() {
					$(_this).closest('.comment-item').remove();
				}, function(object, error) {
					logErr('delete comment failed', error);
				});
			}
		}
	}, 'span.delete-comment');

}
