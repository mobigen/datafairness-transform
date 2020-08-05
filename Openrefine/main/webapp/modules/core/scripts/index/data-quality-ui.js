const Grid = tui.Grid;
const Pagination = tui.Pagination;
const Chart = tui.chart;

var ui = {};

var PAGE_INFO = {
	PAGE_VAL : 1,
	ITEM_PER_PAGE : 15,
	START : 0
}

var UI_CHART_INFO = {
	selectedPId : '',
	headerIndex : {}
}

/* ************************************
 * tui.grid header column checkbox creator
 * ************************************/
var CustomColumnHeader = function(props) {
    const columnInfo = props.columnInfo;
    const el = document.createElement('div');
    el.className ='custom_table_header';
    
    const chkElWrapper = document.createElement('div');
    const chkEl = document.createElement('input');
    chkEl.type = 'checkbox';
    chkEl.name = `${columnInfo.header}`;
    chkEl.className = 'custom_table_header_check';
    chkElWrapper.appendChild(chkEl);
    el.appendChild(chkElWrapper);
    
    const txtEl = document.createElement('span');
    txtEl.className = 'custom_table_header_span';
    txtEl.textContent = `${columnInfo.header}`;
    el.appendChild(txtEl);
    
    this.el = el;

    this.render(props);
}
CustomColumnHeader.prototype.getElement = function() {
	return this.el;
}
CustomColumnHeader.prototype.render = function(props) {
	this.el.value = props.value;
}

/* ************************************
 * data-quality-ui.js start
 * ************************************/
Refine.SetDataQualityUI = function(elmt) {
	var self = this;

	elmt.html(DOM.loadHTML("core", "scripts/index/data-quality-ui.html"));

	this._elmt = elmt;
	this._elmts = DOM.bind(elmt);

	ui = DOM.bind($("#data-quality-body"));

	// initialzed
	this._getProjectList();
	this._btnSetting();
};

Refine.SetDataQualityUI.prototype._createGrid = function() {
	const columns = this._createColumns(false);
	const headerColumns = this._createColumns(true);
	
	this.GridInstance = new Grid({
		  el: document.getElementById('project_table'), // Container element
//		  rowHeaders: ['rowNum'],
		  columns: columns,
		  data: [],
		  header : {
			  columns: headerColumns,
			  height : 100
		  },
		  columnOptions : {
			  minWidth : 120
		  }
		});
	var theme = {
		selection: {
			background: '#4daaf9',
			border: '#004082'
		},
		scrollbar: {
			background: '#f5f5f5',
		    thumb: '#d9d9d9',
		    active: '#c1c1c1'
    	},
    	row: {
    		even: {
    			background: '#f2f2f2'
    		},
		    hover: {
		    	background: '#ccc'
		    }
    	},
    	cell: {
    		normal: {
    			background: '#fbfbfb',
    			border: '#e0e0e0',
    			showVerticalBorder: true
		    },
		    header: {
		    	background: '#eee',
		    	border: '#ccc',
		    	showVerticalBorder: true
		    },
		    rowHeader: {
		    	border: '#ccc',
		    	showVerticalBorder: true
		    },
		    editable: {
		    	background: '#fbfbfb'
		    },
		    selectedHeader: {
		    	background: '#d8d8d8'
		    },
		    focused: {
		    	border: '#418ed4'
		    },
		    disabled: {
		    	text: '#b0b0b0'
		    }
    	}
	}
//	Grid.applyTheme('striped'); // Call API of static method
	Grid.applyTheme('default', theme)
}
Refine.SetDataQualityUI.prototype._createPagination = function(totalCount) {
	$('#data-quality-pagination').show();
	
	// pagination
	this.pageInstance = new Pagination('data-quality-pagination', {
        totalItems: totalCount,
        itemsPerPage: PAGE_INFO.ITEM_PER_PAGE,
        visiblePages: 10,
        page: PAGE_INFO.PAGE_VAL,
    });
    this.pageInstance.on('afterMove', function(eventData) {
    	PAGE_INFO.PAGE_VAL = eventData.page
    	PAGE_INFO.START = PAGE_INFO.ITEM_PER_PAGE * (eventData.page-1)
    	this._getProjectData();
    }, this);
}


Refine.SetDataQualityUI.prototype._getProjectList = function() {
	const self = this;
	$.getJSON(
			"command/core/get-all-project-metadata",
			null,
			function(data) {
				self._renderProjects(data);
			},
			"json"
	);
}
Refine.SetDataQualityUI.prototype._renderProjects = function(data) {
	var selectbox = this._elmts.project_selectbox.empty();
	const projectIds = Object.keys(data.projects);
	
	// project 목록이 없는 경우, selectbtn을 disabled 하고 return한다.
	var optionHtml = '';
	if (projectIds.length == 0) {
		optionHtml = '<option>No projects</option>'; 
		this._elmts.project_select_btn.prop('disabled', true);
		return;
	} else {
		projectIds.forEach((pId) => {
			const p = data.projects[pId];
			optionHtml+= '<option value="'+pId+'" projectName="'+p.name+'">';
			optionHtml+= '['+pId+'] '+p.name;
			optionHtml+= '</option>'
		})
	}
	selectbox.append(optionHtml);
}
Refine.SetDataQualityUI.prototype._btnSetting = function() {
	// text 처리
	this._elmts.project_select_lebel.text($.i18n('core-index-data/project-label')+":");
	this._elmts.project_select_btn.text($.i18n('core-index-data/select'));
	this._elmts.get_sta_bnt.text($.i18n('core-index-data/basic-data-statistics'));
	this._elmts.select_all_label.text($.i18n('core-index-data/select-all-label'));
	
	// btn click 이벤트
	this._elmts.project_select_btn.on('click', {_self : this}, function(e) {
		DialogSystem.showBusy();
		
		const _self = e.data._self;
		
		_self.columnModel = null;
		
		// reset
		_self._elmts.project_table.empty();
		_self._elmts.check_all.attr('checked', false)
		$('#data-quality-pagination').hide();
		
		_self.GridInstance = null;
		_self.staticGridInstance2 = null;
		
		_self.selectedPName = _self._elmts.project_selectbox.find(':selected').attr('projectname')
		UI_CHART_INFO.selectedPId = _self._elmts.project_selectbox.val();
		
		setTimeout(()=>{
			_self._getModelInfo();
			_self._getProjectData();
		}, 100)
	})
	
	this._elmts.select_all_label.on('click', {_self : this}, (e) => {
		const _self = e.data._self;
		_self._elmts.check_all.click()
	})
	this._elmts.check_all.on('change', {_self : this}, (e) => {
		const _self = e.data._self;
		// 프로젝트 선택 전일경우 alert을 띄운다.
		if (_self.selectedPName == undefined) {
			alert($.i18n('core-index-data/no-selected-project'))
			$(e.target).removeProp('checked');
	       return;
		}
		
		const selectAllChecked = $(e.target).is(':checked');
		var checkBtns = $('#data-quality-body .custom_table_header_check');
		checkBtns.each((i, cb)=>{
			$(cb).attr('checked', selectAllChecked)	
		})
	})
	
	this._elmts.get_sta_bnt.on('click', {_self : this}, (e) => {
		const _self = e.data._self;

		const checked = $('#data-quality-body .custom_table_header_check:checked');
		var headerOriginalNames = [];
		checked.each((i, _c) => {
			headerOriginalNames.push(UI_CHART_INFO.headerIndex[_c.name])
		})
		
		// 선택된 프로젝트가 없음 > 진행불가능
		if (_self.selectedPName == undefined) {
			alert($.i18n('core-index-data/no-selected-project'))
		} else if (headerOriginalNames.length == 0) {
//			// 선택된 header가 없음 > prompt를 띄워서 전체선택을 하는것인지 확인한다.
//			const response = prompt($.i18n('core-index-data/no-selected-headers'), 'yes')
//			// '취소'버튼 클릭 > 아무것도 하지 않는다.
//			if (response == null || response == '') {
//				// do nothing					
//			} else if (response.toLocaleLowerCase() === 'yes' || response.toLocaleLowerCase() === 'y') {
//				// yes 나 y를 입력 > 전체선택 진행
//				new BasicStatisticsDialogUI('all');
//			} else {
//				// 다른값을 입력 > alert을 띄우고 prompt를 다시 진행하도록 유도
//				alert($.i18n('core-index-data/wrong-input'))
//			}
			
			alert($.i18n('core-index-data/no-selected-headers'))
		} else {
			// 선택된 header가 있음 > 그 header로 진행
			new BasicStatisticsDialogUI(headerOriginalNames);
		}
	})
}
Refine.SetDataQualityUI.prototype._makeDataObj = function(rows) {
	const _header = this.columnModel.columns;
	
	function createArr(cells) {
		var obj = {}
		
		for (var i = 0, size = _header.length; i < size; i++) {
			const h = _header[i];
			obj[h.name] = cells[h.cellIndex].v;
		}
		return obj;
	}
	
	var arr = [];
	rows.forEach((r) => {
		arr.push(createArr(r.cells));
	})
	return arr;
}

Refine.SetDataQualityUI.prototype._getModelInfo = function() {
	var _self = this;
	
	$.ajaxSetup({ async: false });
    $.getJSON(
    		"command/core/get-models?" + $.param({ project: UI_CHART_INFO.selectedPId }), null,
    		function(data) {
    			_self.columnModel = data.columnModel;
    		},
    	'json'
    );
    $.ajaxSetup({ async: true});
}

Refine.SetDataQualityUI.prototype._getProjectData = function() {
	var _self = this;
	$.post(
			"command/core/get-rows?" + $.param({ project: UI_CHART_INFO.selectedPId, start: PAGE_INFO.START, limit: PAGE_INFO.ITEM_PER_PAGE }),
			{engine: {}},	// no history option
			function(data) {
				DialogSystem.dismissAll();
				
				if(data.code === "error") {
					alert('error')
				} else {
					_self._setGridData(data);
//					_self._convertData(data);
				}
			},
			"json"
	);
}
Refine.SetDataQualityUI.prototype._setGridData = function(data) {
	var rows = data.rows;
	
	if (rows.length > 0) {
		// show panel
		this._elmts.project_table.show();
	} else {
		// hide panel
		this._elmts.project_table.hide();
	}
	
	if (this.GridInstance == undefined) {
		this._createGrid();
		this._createPagination(data.total)
	}

	const newData = this._makeDataObj(rows);
	this.GridInstance.resetData(newData); // Call API of instance's public method

	this._elmts.get_sta_bnt.attr('disabled', false);
	
	function headerClicked(target) {
		$(target).find('.custom_table_header_check').click();
	}
	$('#data-quality-body th').off('click');
	$('#data-quality-body th span').off('click');
	//after grid data loaded, set Header Click EVENT
	$('#data-quality-body th').click((e) => {
		headerClicked(e.target);
	})
	$('#data-quality-body th span').click((e) => {
		headerClicked(e.target.parentNode.parentNode);
	})
}

Refine.SetDataQualityUI.prototype._createColumns = function(isHeaderColumn) {
	var columnArr = [];
	
	if (this.columnModel != undefined) {
		this.columnModel.columns.forEach((c, i) => {
			UI_CHART_INFO.headerIndex[c.name] = c.cellIndex
			
			var obj = {};
			if (isHeaderColumn) {
				// renderer 추가
				obj['header'] = c.name; 
				obj['name'] = c.name;
				obj['renderer'] = CustomColumnHeader;
			} else {
				obj['header'] = c.name; 
				obj['name'] = c.name;
				obj['align'] = 'right'
			}
			columnArr.push(obj);
		}, {_self : this});
	}
	return columnArr;
}

Refine.SetDataQualityUI.prototype.resize = function() {
};

Refine.actionAreas.push({
	id : "data-qulity",
	label : $.i18n('core-index-data/data-quality-asses'),
	uiClass : Refine.SetDataQualityUI
});
