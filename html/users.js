const WorkEditor = {
    data() {
        return {
            curentGroup: {id:'', name:'', users: [], comment: ''},
            allGroups: []
        }
    },

    created:  function(){
        this.loadGroups()
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

        loadGroups(){
            let grList = []
            this.DBask('SELECT * FROM groups',[]).then(res=>{
                for (var i = 0; i < res.rows.length; i++) 
                {
                    grList.push(res.rows.item(i))
                }
                this.allGroups = grList
            })
        },

        inputGroupName(event) {
            this.curentGroup.name = event.target.value            
        },

        addGroup: async function(){
            let thisGroupId = ''
            if(this.curentGroup.id){ //                     Если эта группа имеет id => она есть в базе, значит редактируем ее найдя по этому id
                thisGroupId = this.curentGroup.id
                this.DBask('UPDATE groups SET name = ? WHERE id = ?',[this.curentGroup.name, thisGroupId]).then(()=>{
                    this.loadGroups()    
                })
            } else{                 //                      Иначе добавляем в базу
                res = await this.DBask('INSERT INTO groups (name) VALUES (?)',[this.curentGroup.name])
                thisGroupId = res.insertId
                this.loadGroups()
            }
            
            for(var i = 0; i < this.curentGroup.users.length; i++){ 
                if(this.curentGroup.users[i].ID){ //                  Если этот человек имеет id => он есть в базе, значит редактируем его найдя по этому id
                    const thisUser = this.curentGroup.users[i]
                    this.DBask('UPDATE users SET name = ?, surname = ? WHERE id = ?',[thisUser.name, thisUser.surname, thisUser.ID])    
                } else { //                                         Иначе добавляем в базу  связывая с текущей группой
                    this.DBask('INSERT INTO users (name, surname) VALUES (?,?)',[this.curentGroup.users[i].name, this.curentGroup.users[i].surname]).then(res=>{
                        this.DBask('INSERT INTO users_groups (usr, grp) VALUES (?,?)',[res.insertId, thisGroupId])
                    })
                }
            }
        },

        openGroup: async function(groupId){
            this.curentGroup.id = groupId
            this.curentGroup.users = []
            let users = []
            res = await this.DBask('SELECT * FROM groups where id = ?',[groupId])
            res = res.rows.item(0)
            this.curentGroup.name = res.name
            res = await this.DBask('SELECT * FROM users where id in (select usr from users_groups where grp =?) order by surname',[groupId])
            for (var i = 0; i < res.rows.length; i++){
                users.push(res.rows.item(i))
            }
            this.curentGroup.users = users
        },

    //                      Student CRUD    
        addNewUser(){
            nude = {ID: '', name:'', surname:''}
            this.curentGroup.users.push(nude)
        },

        deleteUser(userInfo){
            if(confirm('Вы уверены, что хотите удалить из списка группы этого студента: '+userInfo.fio+'?')){
                this.DBask('DELETE FROM users_groups where usr = ?',[userInfo.id]).then(()=>{
                    this.curentGroup.users.splice(userInfo.idx, 1)
                })
            }
            
        },

        userPropEdit(event){
            if(event.target.className == 'username'){
                this.curentGroup.users[event.target.id].name = event.target.value    
            } else if (event.target.className == 'usersurname'){
                this.curentGroup.users[event.target.id].surname = event.target.value 
            }   
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
                    tx.executeSql("CREATE TABLE tasks (ID Integer PRIMARY KEY AUTOINCREMENT, student Integer, ask text, rightanswer text, answer text, work Integer, date Integer)", [], function(result){alert('ok!')}, function(tx, error){alert('error')});
                    });
            } 
            else {console.log('ERROR! The database has not been connected!'); return;}
        },
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