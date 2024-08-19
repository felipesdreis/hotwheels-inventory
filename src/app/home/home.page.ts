import { Component, OnInit } from '@angular/core';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage'; // Corrigido
import { Firestore, collection, collectionData, addDoc  } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Car {
  name: string;
  model: string;
  imageUrl: string;
}


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {
  cars: Car[] = [];
  cars$: Observable<Car[]> | undefined;
  selectedFile: File | null = null; // Para armazenar o arquivo selecionado

  constructor(private storage: Storage, private firestore: Firestore) { }

  ngOnInit() {
    this.loadCars();
  }

  loadCars() {
    console.log('inicio carregar dados')
    const carsCollection = collection(this.firestore, 'hotwheels');
    this.cars$ = collectionData(carsCollection, { idField: 'id' }) as Observable<Car[]>;
    this.cars$.subscribe(data => {
      this.cars = data;
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  addCar() {
    const name = prompt('Enter car name');
    const model = prompt('Enter car model');
    const file = this.selectedFile;

    console.log('inicio save')

    if (name && model && file) {
      const filePath = `images/${new Date().getTime()}_${file.name}`;
      const storageRef = ref(getStorage(), filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Pode adicionar algum tratamento durante o upload, se necessário
        },
        (error) => {
          console.error("Upload failed: ", error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            this.cars.push({ name, model, imageUrl: downloadURL });
            this.selectedFile = null; // Limpar a seleção de arquivo após o upload
            // Salvar o novo carro no Firestore
            this.saveCar({ name, model, imageUrl: downloadURL });
          });
        }
      );
    } else {
      console.error("Missing information: name, model, or file.");
    }
  }

  saveCar(car: Car) {
    const carsCollection = collection(this.firestore, 'hotwheels');
    addDoc(carsCollection, car);
  }

}

