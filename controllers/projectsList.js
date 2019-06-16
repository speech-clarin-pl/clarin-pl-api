
//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {
    res.status(200).json({
        projects: [
            {
            _id: 'p1',
            name: 'Jakiś tytuł projektu Mariusz :)',
            owner: 'You',
            modified: new Date().toISOString(),
            },
            {
            _id: 'p2',
            name: 'Jakiś tytuł projektu 2 bla bla',
            owner: 'You',
            modified: new Date().toISOString(),
            },
            {
            _id: 'p3',
            name: 'Jakiś tytuł projektu 3',
            owner: 'You',
            modified: new Date().toISOString(),
            }
        ]})
}


//dodawanie nowego projektu
exports.createProject = (req, res, next) => {
    const projectName = req.body.name;
//tutaj stworzyc nowy wpis w mongo
    res.status(201).json({
        message: 'The project created successfully!',
        project: {id: new Date().toISOString(), name: projectName}
    });
}