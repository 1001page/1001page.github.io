/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	
	config.toolbar = [
	                  [ 'PasteText','Image','Table','CodeSnippet','codesnippet'
	                    , 'Blockquote' , 'Link', 'Unlink','HorizontalRule','PageBreak', 'JustifyLeft'
	                    , 'JustifyCenter', 'JustifyRight', 'JustifyBlock','NumberedList','BulletedList']
	                  ,'/',
	                    ['Uploadcare','Outdent','Indent','Bold','Italic','Strike','TextColor', 'BGColor' ,
	                    'RemoveFormat','Font', 'FontSize'
	                      ]
	              ];
	
	//config.toolbar = null;
	config.font_names=' 宋体/宋体;黑体/黑体;仿宋/仿宋_GB2312;楷体/楷体_GB2312;隶书/隶书;幼圆/幼圆;微软雅黑/微软雅黑;' + config.font_names;
	config.language = 'zh-cn';
	config.font_defaultLabel = '宋体';
	config.fontSize_defaultLabel = '12px';
	config.codeSnippet_languages = {
			coffeescript:'CoffeeScript',
			css: 'CSS',
		    javascript: 'JavaScript',
		    html: 'HTML',
		    java:'Java',
		    json:'JSON',
		    markdown:'Markdown',
		    xml:'XML'
		};
	
	config.title = false;
	config.toolbarCanCollapse = true;
	config.toolbarStartupExpanded = false;
	config.sharedSpaces = {
		    top: 'editorToolbar'
		};
	config.extraPlugins='sharedspace,codesnippet,font,uploadcare';

	config.removePlugins= 'floatingspace,resize,elementspath';
};
