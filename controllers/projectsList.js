
//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {
    res.status(200).json({
        projects: [
            {
                _id: 'p1',
                name: 'Jakiś tytuł projektu Mariusz :)',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            },
            {
                _id: 'p2',
                name: 'Jakiś tytuł projektu 2 bla bla',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            },
            {
                _id: 'p3',
                name: 'Jakiś tytuł projektu 3',
                owner: 'You',
                modified: new Date(),
                owner: "idOwnera1",
                accessToRead: [],
                accessToEdit: []
            }
        ]
    })
}


//dodawanie nowego projektu
exports.createProject = (req, res, next) => {
    const reqProjectName = req.body.projectName;
    //console.log(reqProjectName); 
    //tutaj stworzyc nowy wpis w mongo
    res.status(201).json({
        message: 'The project created successfully!',
        project: { 
            _id: new Date(),
            name: reqProjectName,
            owner: 'You',
            modified: new Date(),
            owner: "idOwnera1",
            accessToRead: [],
            accessToEdit: []
         }
    });
}