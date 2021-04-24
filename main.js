define(["require"], function (require) {

    True_container = null;
    Columns = null;
    _column_initialized = false;

   // function copy_cell_to_column_bottom(col_index) {
    //     //var true_container = Jupyter.notebook.container;
    //     var col = Columns[col_index];

    //     Jupyter.notebook.copy_cell();
    //     Jupyter.notebook.container = col;
    //     // make the last cell selected
    //     var col_cells = Jupyter.notebook.get_cells();
    //     var last_cell = col_cells[col_cells.length-1];
    //     last_cell.selected = true;
    //     Jupyter.notebook.paste_cell_below();
    //     Jupyter.notebook.clipboard = []

    //     // repeatly mark all cells with column index
    //     col_cells = Jupyter.notebook.get_cells();
    //     var cell;
    //     for (var i=0; i < col_cells.length; i++) {
    //         cell = col_cells[i]; 
    //         cell.metadata.column_index = col_index;
    //     }

    //     Jupyter.notebook.container = True_container; 
    // }

    // function copy_cell_to_column_one_bottom(){
    //     copy_cell_to_column_bottom(0)
    // }

    // function copy_cell_to_column_two_bottom(){
    //     copy_cell_to_column_bottom(1)
    // }

    function set_column_as_container(index){
        Jupyter.notebook.container = Columns[index];
    }

    function restore_true_container(){
        Jupyter.notebook.container = True_container;
    }

    function paste_to_column_bottom(index){
        // var col = Columns[index];
        set_column_as_container(index);
        var col_cells = Jupyter.notebook.get_cells();
        var last_cell;
        if(col_cells.length>0){
            last_cell = col_cells[col_cells.length-1];
            last_cell.selected = true;
            Jupyter.notebook.paste_cell_below();
            last_cell.selected = false;
        }
        else{
            last_cell = Jupyter.notebook.insert_cell_at_index(0);
            last_cell.selected = true;
            Jupyter.notebook.paste_cell_below();
            Jupyter.notebook.delete_cells([0])
        }
        restore_true_container();

    }

    function mark_column_metadata() {
        console.log("Mark Metedata");
        Jupyter.notebook.container = Columns[0];
        var cells = Jupyter.notebook.get_cells();
        var cell;
        for (var i=0; i < cells.length; i++) {
            cell = cells[i];
            cell.metadata.column_index = 0;
        }

        Jupyter.notebook.container = Columns[1];
        cells = Jupyter.notebook.get_cells();
        for (var i=0; i < cells.length; i++) {
            cell = cells[i];
            cell.metadata.column_index = 1;
        }

        restore_true_container();
        Jupyter.notebook.metadata.two_column_enabled = true;

    }

    function move_cell_to_column_bottom(col_index) {
        // var col = Columns[col_index];

        Jupyter.notebook.cut_cell();
        paste_to_column_bottom(col_index);
        // Jupyter.notebook.container = col;
        // // make the last cell selected
        // var col_cells = Jupyter.notebook.get_cells();
        // if(col_cells.length>0){
        //     var last_cell = col_cells[col_cells.length-1];
        //     last_cell.selected = true;
        // }
        // Jupyter.notebook.paste_cell_below();
        // if(col_cells.length>0){
        //     last_cell.selected = false;
        // }

        // repeatly mark all cells with column index
        mark_column_metadata();
    }


    function move_cell_to_column_one_bottom(){
        move_cell_to_column_bottom(0)
    }

    function move_cell_to_column_two_bottom(){
        move_cell_to_column_bottom(1)
    }

    function copy_cells_to_jupyter_clipboard(cells){
        Jupyter.notebook.clipboard = [];
        var cell_json;
        for (var i=0; i < cells.length; i++) {
            cell_json = cells[i].toJSON();
            if (cell_json.metadata.deletable !== undefined) {
                delete cell_json.metadata.deletable;
            }
            Jupyter.notebook.clipboard.push(cell_json);
        }
        Jupyter.notebook.enable_paste();
    }

    function append_empty_cell_to_column(index){
        Jupyter.notebook.container = Columns[index];
        var ncells = Jupyter.notebook.ncells();
        var cell = Jupyter.notebook.insert_cell_at_index(ncells);
        cell.metadata.column_index = index;
        Jupyter.notebook.container = True_container;
    }


  

    function initialize_columns(){

        if(_column_initialized){
            return;
        }

        // change width
        $('#notebook-container').css("width", "80%");

        // create column1
        var c1 = $('<div><p style="text-align:center">Column 1</p><div/>').attr("id", "col1")
        c1.addClass("container");
        c1.css("width", "50%")
        c1.css("float", "left")
        // c1.css("background", "lightblue")
        Jupyter.notebook.container.append(c1)

        // create column2
        var c2 = $('<div><p style="text-align:center">Column 2</p><div/>').attr("id", "col2")
        c2.addClass("container");
        c2.css("width", "50%")
        c2.css("float", "left")
        // c2.css("background", "lightblue")
        Jupyter.notebook.container.append(c2)

        // create handle
        True_container = Jupyter.notebook.container
        Columns = [c1, c2];

        // split into col1 and col2 cells
        var col1_cells = [];
        var col2_cells = [];
        var cells = Jupyter.notebook.get_cells();
        var cell;
        var old_cell_indices = []
        for (var i=0; i < cells.length; i++) {
            cell = cells[i];
            console.log(i, "cell column index", cell.metadata.column_index);
            // console.log(cell.source);

            if (cell.metadata.column_index == undefined){
                console.log("orphan cell", cell.id);
                cell.metadata.column_index = 1;
            }

            if(cell.metadata.column_index === 0){
                col1_cells.push(cell);
                // col1_cell_indices.push(i);
            } 
            else if (cell.metadata.column_index === 1){
                col2_cells.push(cell);
                // col2_cell_indices.push(i);
            }  else {
                console.log("Unrecognized Column Index", cell.metadata.column_index)
            }

            old_cell_indices.push(i);
        }
        
        // move cells
        if ( col1_cells.length == 0){  // if empty add a empty cell
            append_empty_cell_to_column(0)
        }else{ // else copy paste
            copy_cells_to_jupyter_clipboard(col1_cells)
            paste_to_column_bottom(0);
            // Jupyter.notebook.container = c1;
            // Jupyter.notebook.paste_cell_below();
            // Jupyter.notebook.container = True_container;
            Jupyter.notebook.clipboard = [];
        }

        if ( col2_cells.length == 0){  // if empty add a empty cell
            append_empty_cell_to_column(1)
        }else{ // else copy paste
            copy_cells_to_jupyter_clipboard(col2_cells)
            paste_to_column_bottom(1);
            // Jupyter.notebook.container = c2;
            // Jupyter.notebook.paste_cell_below();
            // Jupyter.notebook.container = True_container;
            Jupyter.notebook.clipboard = [];
        }
        Jupyter.notebook.delete_cells(old_cell_indices);

        _column_initialized = true;
        Jupyter.notebook.metadata.two_column_enabled = true;
    };

    function unmark_notebook(){
        Jupyter.notebook.metadata.two_column_enabled = true;
    }

    function add_toolbar_buttons(){
        console.log("add button!!!")

        Jupyter.actions.register({
            'help'   : 'Split Column',
            'icon'    : 'fa-th-large', 
            'handler': initialize_columns,
        }, 'split_column', 'two-column');

        Jupyter.actions.register({
                'help'   : 'Move to Col1',
                'icon'    : 'fa-angle-left', 
                'handler': move_cell_to_column_one_bottom,
            }, 'move_to_1', 'two-column');

        Jupyter.actions.register({
            'help'   : 'Move to Col2',
            'icon'    : 'fa-angle-right', 
            'handler': move_cell_to_column_two_bottom,
        }, 'move_to_2', 'two-column');

        Jupyter.actions.register({
            'help'   : 'Mark Cell MetaData',
            'icon'    : 'fa-copyright', 
            'handler': mark_column_metadata,
        }, 'mark_metadata', 'two-column');

        Jupyter.actions.register({
            'help'   : 'Turn off Two-column (work after reloading)',
            'icon'    : 'fa-eraser', 
            'handler': unmark_notebook,
        }, 'unmark_notebook', 'two-column');


        IPython.toolbar.add_buttons_group([
            {
            'action': 'two-column:split_column'
            },
            {
            'action': 'two-column:move_to_1'
            },
            {
            'action': 'two-column:move_to_2'
            },
            {
            'action': 'two-column:mark_metadata'
            },
            {
            'action': 'two-column:unmark_notebook'
            },
        ], 'two-column-buttons');

    }

    // TODO: 1 - modify keybinding: `bb` add new cell in column, `left/right arrow` switch column
    //       2 - function to toggle back to normal mode
    //       3 - patch Notebook prototype: save with metadata marked

    function conditional_init(){
        if(Jupyter.notebook.metadata.two_column_enabled){
            initialize_columns();
        }
    }

    var load_ipython_extension = function () {
        
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            // this tests if the notebook is fully loaded
            conditional_init();
        } else {
            events.on("notebook_loaded.Notebook", function() {
                conditional_init();
            });
        }

        if (!IPython.toolbar) {
            $([IPython.events]).on("app_initialized.NotebookApp", add_toolbar_buttons);
            return;
        } else {
            add_toolbar_buttons();
        }
        
    };
    
    return {
            load_ipython_extension : load_ipython_extension,
            columns : Columns,
        };

})
