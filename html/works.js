const WorkEditor = {
    data() {
        return {
            curentWork: {id:'', name:'', group: '', template: '', date: ''},
            allWorks: [],
            groups: [],
            templates: [],
            revision: false,
            workCheckList: [{name:'', surname: '', answers: [] }]
        }
    },

    created:  function(){
        this.loadWorks()
        this.loadGroups()
        this.loadTemplates()
    },


    methods: {
    //                      Group CRUD    
        DBask(ask, arg){
            const db = openDatabase("TWP4", "0.1", "TWP test database", 20000)
            return new Promise((resolve, reject)=>{
                if(db) {
                    db.transaction(tx => { tx.executeSql(ask, arg, (tx, result) => {
                        resolve(result)
                    }, (tx, error)=>{reject(error)}) })
                }
                else{
                    reject(new Error('DB connection failed'))
                }
            })
        },

        loadWorks(){
            let itemsList = []
            this.DBask('SELECT * FROM works',[]).then(res=>{
                for (var i = 0; i < res.rows.length; i++) 
                {
                    itemsList.push(res.rows.item(i))
                }
                this.allWorks = itemsList
            })
        },

        loadGroups(){
            let itemsList = []
            this.DBask('SELECT id, name FROM groups',[]).then(res=>{
                for (var i = 0; i < res.rows.length; i++) 
                {
                    itemsList.push(res.rows.item(i))
                }
                this.groups = itemsList
            })
        },

        loadTemplates(){
            let itemsList = []
            this.DBask('SELECT id, title FROM templates',[]).then(res=>{
                for (var i = 0; i < res.rows.length; i++) 
                {
                    itemsList.push(res.rows.item(i))
                }
                this.templates = itemsList
            })
        },

        workPropEdit(event){
            if(event.target.id == 'workName'){
                this.curentWork.name = event.target.value    
            } else if (event.target.id == 'workGroup'){
                this.curentWork.group = event.target.value 
            } else if (event.target.id == 'workDate'){
            this.curentWork.date = event.target.value 
            } else if (event.target.id == 'workTemplate'){
                this.curentWork.template = event.target.value 
            }
            if(event.target.className == "answerInput"){
                let theTestItem = this.workCheckList.find(item => item.studentId == event.target.name)
                let theTask = theTestItem.answers.find(item => item.id == event.target.id)
                theTask.answer = event.target.value
            } 
        }, 

        addNewWork: async function(){
            let thisWork = await this.DBask('insert into works (grp, name, template, date) values (?, ?, ?, ?)',[this.curentWork.group, this.curentWork.name, this.curentWork.template, this.curentWork.date])
            let thisWorkId = thisWork.insertId
            let theseUsers = await this.DBask('select usr from users_groups where grp = ?',[this.curentWork.group])
            let theseExercises = await this.DBask('SELECT * FROM exercises where id in (SELECT exercise FROM templates_exercises where template =?) order by id',[this.curentWork.template])
            for(var i = 0; i < theseUsers.rows.length; i++){ 
                let thisUserId = theseUsers.rows.item(i).usr
                console.log(thisUserId)
                for(var j = 0; j < theseExercises.rows.length; j++){
                    let thisExercise = theseExercises.rows.item(j)
                    let taskRender = new Function(thisExercise.body)
                    let ask =  taskRender().ask
                    let rightanswer = taskRender().ans                    
                    this.DBask('insert into tasks (student, work, ask, rightanswer) values (?, ?, ?, ?)',[thisUserId, thisWorkId, ask, rightanswer])
                }
            }
            this.loadWorks() 
        },

        openWork(workId){
            this.DBask('select * from works where id = ?',[workId]).then(theWork=>{
                theWork = theWork.rows.item(0)
                this.curentWork.id = workId
                this.curentWork.name = theWork.name 
                this.curentWork.date = theWork.date
                this.DBask('select name from groups where id = ?',[theWork.grp]).then(res=>{
                    this.curentWork.group = res.rows.item(0).name
                })  
                this.DBask('select title from templates where id = ?',[theWork.template]).then(res=>{
                    this.curentWork.template = res.rows.item(0).title
                })   
            })
        },

        deleteWork(workId){
            if(confirm('Вы уверены, что хотите удалить работу?')){
                this.DBask('DELETE FROM tasks where work = ?',[workId]).then(()=>{
                    this.DBask('DELETE FROM works where id = ?',[workId]).then(()=>{
                        this.curentWork = {id:'', name:'', group: '', template: '', date: ''} 
                        this.loadWorks()
                    })    
                })
            }
        },

        printWork: async function(workId){
            let text = ''
            text += '\n\\begin{document}'
            let theWork = await this.DBask('select * from works where id = ?',[workId])
            theWork = theWork.rows.item(0)
            let theTasksSQL = await this.DBask('select * from tasks where work = ? order by id',[workId])
            let theTasks = []
            for(var i = 0; i < theTasksSQL.rows.length; i++){
                theTasks.push(theTasksSQL.rows.item(i))
            }
            
            let theStudents = await this.DBask('select * from users where id in (select usr from users_groups where grp = ?) order by surname',[theWork.grp])
            for(var i = 0; i < theStudents.rows.length; i++){
                let theStudent = theStudents.rows.item(i)

                text += '\\hfill \\break \\Large \n' + theStudent.name + ' ' + theStudent.surname + '\n \\normalsize'
                let theStudentTasks = theTasks.filter(item => item.student == theStudent.ID)
                text+= '\n \\begin{enumerate}'
                for(const task of theStudentTasks){
                    text += '\n \\item '+task.ask    
                }
                text+= '\n \\end{enumerate}'
            }
            text += '\n\\end{document}'
            this.writeFile(theWork.name+".tex", text);
        },

        checkWork: async function(){
            this.revision = true
        
            //                      Собираем все данные о работе
            let theWork = await this.DBask('select * from works where id = ?',[this.curentWork.id])
            theWork = theWork.rows.item(0)
            let theTasksSQL = await this.DBask('select * from tasks where work = ? order by id',[this.curentWork.id])
            
            //                      Формируем набор всех заданий для всех студентов для данной работы
            let theTasks = []
            for(var i = 0; i < theTasksSQL.rows.length; i++){
                theTasks.push(theTasksSQL.rows.item(i))
            }
            //                      Формируем список студентов
            let theStudents = await this.DBask('select * from users where id in (select usr from users_groups where grp = ?) order by surname',[theWork.grp])
            //                      Создаем чек-лист и заполняем его в цикле
            let checkList = []
            for(var i = 0; i < theStudents.rows.length; i++){
                let checkListItem = {}
                let theStudent = theStudents.rows.item(i)
                checkListItem.studentId = theStudent.ID
                checkListItem.name = theStudent.name
                checkListItem.surname = theStudent.surname
                checkListItem.answers = []
                checkListItem.passed = false

                let theStudentTasks = theTasks.filter(item => item.student == theStudent.ID)
                
                for(const task of theStudentTasks){
                    checkListItem.answers.push({id: task.ID, answer: task.answer, rightanswer: task.rightanswer}) 
                    if(task.answer){checkListItem.passed = true}   
                }
                
                checkList.push(checkListItem)
            }
            this.workCheckList = checkList
        },

        sendAnswers(studentId){
            let theTestItem = this.workCheckList.find(item => item.studentId == studentId)
            for(let answer of theTestItem.answers ){
                if(!answer.answer){
                    answer.answer = 'passed' 
                }
                this.DBask('update tasks  set answer = ? where id =?',[answer.answer, answer.id]).then(()=>{
                    this.checkWork()
                })
            }
        },

//                          Other options

        testMethod(){


                
            this.writeFile("9dksk239xwd.txt", "jxowsjsivneic");

        },

        createTable() {
            db = openDatabase("TWP4", "0.1", "TWP test database", 20000);
            if(db) {
                console.log('The database has been connected')
                db.transaction(function(tx) {
                    tx.executeSql("CREATE TABLE tasks (ID Integer PRIMARY KEY AUTOINCREMENT, student Integer, ask text, rightanswer text, answer text, work Integer, date Integer)", [], function(result){alert('ok!')}, function(tx, error){alert('error')});
                    });
            } 
            else {console.log('ERROR! The database has not been connected!'); return;}
        },


        writeFile(name, value) {
            var val = value;
            if (value === undefined) {
            val = "";
            }
            var download = document.createElement("a");
            download.href = "data:text/plain;content-disposition=attachment;filename=file, " + val;
            download.download = name;
            download.style.display = "none";
            download.id = "download"; document.body.appendChild(download);
            document.getElementById("download").click();
            document.body.removeChild(download);
            } 
        
    }
}

Vue.createApp(WorkEditor).mount('#bars')

/*            this.DBask('SELECT * FROM users_groups',[]).then(res=>{
                
                console.log(res.rows.length)
            }, error=>{
                console.log(error)
            })
            
            CREATE TABLE tasks (ID Integer PRIMARY KEY AUTOINCREMENT, student Integer, ask text, rightanswer text, answer text, work Integer, date Integer
            */