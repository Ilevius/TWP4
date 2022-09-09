const WorkEditor = {
    data() {
        return {
            templateTitle: '',
            PreviewContent: 'Здесь появится превью работы.',
            newSubjectName: '',
            tasks: [],
            subjects: [], 
            templates: [],
            currentTemplate: {}
        }
    },

    computed: {
        db: function (){
            return openDatabase("TWP4", "0.1", "TWP test database", 20000);
        }
    },

    methods: {

        MakePreview(event) {
            this.PreviewContent = '<ol>'
            for (var i = 0; i < this.tasks.length; i++) 
            {
                this.PreviewContent += '<li>'
                let taskRender = new Function (this.tasks[i])
                this.PreviewContent += taskRender().ask
                this.PreviewContent += '<br>'
                this.PreviewContent += '<strong>Ответ: </strong>'
                this.PreviewContent += taskRender().ans
                this.PreviewContent += '</li>'
            }
            this.PreviewContent += '</ol>'
        },

        changeTask(event) {
            this.tasks[event.target.id] = event.target.value
            this.MakePreview()
        },

        adNewTask(){
            this.tasks.push(`return {ask: '', ans: ''}`)
        },

        DeleteTask(idx){
            this.tasks.splice(idx, 1)
        },

            // CRUD for subjects



        inputSubjectName(event) {
            this.newSubjectName = event.target.value            
        },

        addNewSubject() {

            let main = (txt)=>{
                db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
                if(db) {
                    console.log('The database has been connected')
                    db.transaction(function(tx) {
                        tx.executeSql("INSERT INTO subjects (name) VALUES (?)", [txt], function(result){
                            
                        }, function(tx, error){alert('error')});
                        });
                } 
                else {console.log('ERROR! The database has not been connected!'); return;} 
            }
            main(this.newSubjectName)
        },

        deleteSubject(idx){
            if(confirm('Удалить предмет?')){
                let main = (id)=>{
                    db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
                    if(db) {
                        db.transaction(function(tx) {
                            tx.executeSql("DELETE FROM subjects WHERE ID = (?)", [id], function(result){
                            }, function(tx, error){alert('Ошибка БД при удалении предмета!')});
                            });
                    } 
                    else {alert('ERROR! The database has not been connected!'); return;} 
                }
                main(idx)
            }
            
        },



        // CRUD for tamplates

        inputTemplateTitle(event) {
            this.templateTitle = event.target.value  
        },

        addNewTemplate() {
            const DBask = (ask, arg)=>{
                return new Promise((resolve)=>{
                    if(this.db) {
                        this.db.transaction(tx => { tx.executeSql(ask, arg, (tx, result) => {
                            resolve(result)
                        }, null) })
                    }
                })
            }
 
            const main = async ()=>{
                let res = await DBask('INSERT INTO templates (title) VALUES (?)',[this.templateTitle])
                res = await DBask('SELECT * FROM templates where id > ? order by ID',['0'])
                lastTemId = res.rows.item(res.rows.length-1)
                lastTemId = lastTemId.ID 
                for (const exercise of this.tasks){
                    res = await DBask('INSERT INTO exercises (body) VALUES (?)', [exercise])
                    res = await DBask('SELECT * FROM exercises where id > ? order by ID',['0'])
                    lastExId = res.rows.item(res.rows.length-1)
                    lastExId = lastExId.ID
                    res = await DBask('INSERT INTO templates_exercises (template, exercise) VALUES (?, ?)', [lastTemId, lastExId])
                }   
                console.log('Новый шаблон сохранен!')
            }

            main()
        },

        loadTemplates() {
            function subsFromDB(callback) {
                let res = []
                let db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
                if(db) {
                    db.transaction(tx => { return tx.executeSql("SELECT * FROM templates", [], (tx, result) => { 
                        for(var i = 0; i < result.rows.length; i++){
                            res.push(result.rows.item(i))
                        }
                        callback(res) 
                    
                    }, null) }) 
                } 
                else {return 'ERROR! The database has not been connected!'}
            }
            const subsToData = res => {
                this.templates = res 
            }
            subsFromDB(subsToData)   
        },

        deleteTemplate(idx){
            if(confirm('Удалить шаблон?')){
                let main = (id)=>{
                    db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
                    if(db) {
                        db.transaction(function(tx) {
                            tx.executeSql("DELETE FROM Templates WHERE ID = (?)", [id], function(result){
                            }, function(tx, error){alert('Ошибка БД при удалении предмета!')});
                            });
                    } 
                    else {alert('ERROR! The database has not been connected!'); return;} 
                }
                main(idx)
            }
            
        },
//                          You will get at middle pannel, title and exercises of some template if you click it  
        openTemplate(id) {        
            let db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
            if(db) {
                db.transaction(tx => { tx.executeSql("SELECT * FROM templates where id =?", [id], (tx, result) => { 
                    thisTemplate = result.rows.item(0)
                    this.currentTemplate = thisTemplate
                    this.templateTitle =  thisTemplate.title
                    db.transaction(tx => { tx.executeSql("SELECT * FROM exercises where id in (SELECT exercise FROM templates_exercises where template =?) order by id", [id], (tx, result) => {
                        this.tasks = []
                        if(result.rows.length>0){
                            for(var i = 0; i < result.rows.length; i++){
                                thisTemplateExecises = result.rows.item(i)
                                this.tasks.push(thisTemplateExecises.body)
                            }
                        }
                        this.MakePreview()    
                    }, null) }) 
                }, null) }) 
            } 
            else {return 'ERROR! The database has not been connected!'}
        },


//                          Other options

        testMethod(){

            this.createTable()
        },

        createTable() {
            db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
            if(db) {
                console.log('The database has been connected')
                db.transaction(function(tx) {
                    tx.executeSql("CREATE TABLE users_groups (ID Integer PRIMARY KEY AUTOINCREMENT, usr integer, grp integer)", [], function(result){alert('ok!')}, function(tx, error){alert('error')});
                    });
            } 
            else {console.log('ERROR! The database has not been connected!'); return;}
        },
    }
}

Vue.createApp(WorkEditor).mount('#bars')
