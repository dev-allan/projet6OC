const Sauce = require('../models/Sauce');
const fs = require('fs');
const regex = /^[a-zA-Z0-9 -]{3,16}$/;

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }))
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }))
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce)
    if (!regex.test(sauceObject.name, sauceObject.manufacturer, sauceObject.description, sauceObject.mainPepper)) {
        res.status(401).json("ne doit contenir que des chiffres des lettres et des espaces")
    } else {
        delete sauceObject._id
        sauceObject.likes = 0
        sauceObject.dislikes = 0
        sauceObject.usersLiked = []
        sauceObject.usersDisliked = []
        const sauce = new Sauce({
            ...sauceObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        })
        sauce.save()
            .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
            .catch(error => res.status(400).json({ error }))
    }
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : {...req.body }
  if (!regex.test(sauceObject.name, sauceObject.manufacturer, sauceObject.description, sauceObject.mainPepper)) {
      res.status(401).json("ne doit contenir que des chiffres des lettres et des espaces")
  } else {
      Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet modifiée !' }))
          .catch(error => res.status(400).json({ error }))
  }
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.likeSauce = (req, res, next) => {
  switch (req.body.like) {
    // Défault = 0
    // Check that the user hasn't already liked the sauce
    case 0:
      Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
          if (sauce.usersLiked.find(user => user === req.body.userId)) {
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'Ton avis a été pris en compte!' }); })
              .catch((error) => { res.status(400).json({ error: error }); });

            // check that the user hasn't already diliked the sauce
          } if (sauce.usersDisliked.find(user => user === req.body.userId)) {
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'Ton avis a été pris en compte!' }); })
              .catch((error) => { res.status(400).json({ error: error }); });
          }
        })
        .catch((error) => { res.status(404).json({ error: error }); });
      break;
    //Updates likes. likes = 1 
    case 1:
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Ton like a été pris en compte!' }); })
        .catch((error) => { res.status(400).json({ error: error }); });
      break;

    //Updates dislikes. dislikes = -1
    case -1:
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Ton dislike a été pris en compte!' }); })
        .catch((error) => { res.status(400).json({ error: error }); });
      break;
    default:
      console.error('mauvaise requête');
  }
};