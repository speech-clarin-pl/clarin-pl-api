
//kontroler do wydobywania listy projektow
exports.getProjectsList = (req, res, next) => {
    res.status(200).json({
        projects: [
            {
            id: 'p1',
            title: 'Jakiś tytuł projektu 1',
            owner: 'You',
            modified: '22.03.2019'
            },
            {
            id: 'p2',
            title: 'Jakiś tytuł projektu 2 bla bla',
            owner: 'You',
            modified: '23.03.2019'
            },
            {
            id: 'p3',
            title: 'Jakiś tytuł projektu 3',
            owner: 'You',
            modified: '24.03.2019'
            }
        ]})
}

exports.createProject = (req, res, next) => {
    
    
    const projectName = req.body.name;
//tutaj stworzyc nowy wpis w mongo
    res.status(201).json({
        message: 'The project created successfully!',
        project: {id: new Date().toISOString(), name: projectName}
    });
}