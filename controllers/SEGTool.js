const Container = require('../models/Container')

exports.openContainerInEmu = (req, res, next) => {

    let containerIdForEMU = req.params.containerId;

    console.log("otwieram do podglądu w EMU")

    //Tutaj zbieram wszystkie informacje potrzebne do otwarcia w EMu

    
    Container.findById(containerIdForEMU)
        .then(foundContainer=>{

            let dataForEMU = {};
            //buduje dane do zwrotu aby dało sie z nich skonstruować taki url
            //https://ips-lmu.github.io/EMU-webApp/?audioGetUrl=https:%2F%2Fmowa.clarin-pl.eu%2Ftools%2Fdownload%2F5ee14ac666eca6f9d593b059&labelGetUrl=https:%2F%2Fmowa.clarin-pl.eu%2Ftools%2Fannot%2F5ef6186e66eca66f0d79e978&labelType=annotJSON

            res.status(201).json({
                message: 'container is ready for preview in EMU',
                dataForEMU: foundContainer,
            });
        })
}


