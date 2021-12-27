import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { Usuario } from '../models/usuario.model';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import 'firebase/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import * as authActions from '../auth/auth.actions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubscription!: Subscription;

  constructor(
    private _auth: AngularFireAuth,
    public _firestore: AngularFirestore,
    private _store: Store<AppState>
  ) {}

  initAuthListener() {
    this._auth.authState.subscribe((fuser) => {
      if (fuser) {
        this.userSubscription = this._firestore
          .doc(`${fuser.uid}/usuario`)
          .valueChanges()
          .subscribe((firestoreUser: any) => {
            const user = Usuario.fromFirebase(firestoreUser);
            this._store.dispatch(authActions.setUser({ user }));
          });
      } else {
        this.userSubscription.unsubscribe();
        this._store.dispatch(authActions.unSetUser());
      }
    });
  }

  crearUsuario(name: string, email: string, password: string) {
    return this._auth
      .createUserWithEmailAndPassword(email, password)
      .then(({ user }) => {
        const newUser = new Usuario(user?.uid, name, email);
        return this._firestore.doc(`${user?.uid}/usuario`).set({ ...newUser });
      });
  }

  loginUsuario(email: string, password: string) {
    return this._auth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this._auth.signOut();
  }

  isAuth() {
    return this._auth.authState.pipe(map((fbUser) => fbUser != null));
  }
}
