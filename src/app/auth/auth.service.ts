import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthModel } from './autth.model';
import { catchError, throwError, tap, BehaviorSubject } from 'rxjs';
import { UserModel } from './user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // user = new Subject<UserModel>();
  user = new BehaviorSubject<UserModel | null>(null);
  private tokenExpirationTimer: any;
  constructor(private http: HttpClient, private router: Router) {}

  signup(email: string, password: string) {
    return this.http
      .post<AuthModel>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDxjmcvia3TTnxkh5l6_lrTa2Bufy4FGCc',
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(catchError(this.handleError), tap(this.handleAuthentication));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthModel>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDxjmcvia3TTnxkh5l6_lrTa2Bufy4FGCc',
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(catchError(this.handleError), tap(this.handleAuthentication));
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('user');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  autoLogin() {
    const localUser: {
      email: string;
      userId: string;
      _expirationDate: Date;
      _idToken: string;
    } = JSON.parse(String(localStorage.getItem('user')));

    if (!localUser) {
      console.log(localUser, ' returning');
      return;
    }

    const loadedUser = new UserModel(
      localUser.email,
      localUser.userId,
      localUser._idToken,
      new Date(localUser._expirationDate)
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDuration =
        new Date(localUser._expirationDate).getTime() - new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  //handles authentication
  private handleAuthentication = (resData: AuthModel) => {
    console.log(resData);
    const expirationDate = new Date(
      new Date().getTime() + Number(resData.expiresIn) * 1000
    );
    const user = new UserModel(
      resData.email,
      resData.localId,
      resData.idToken,
      expirationDate
    );

    //emits logged in user
    this.user.next(user);
    this.autoLogout(+resData.expiresIn * 1000);
    localStorage.setItem('user', JSON.stringify(user));
  };

  //handles the error
  private handleError = (errResponse: HttpErrorResponse) => {
    let errorMessage = 'An Error Occured!';

    if (!errResponse.error || !errResponse.error.error) {
      return throwError(() => errorMessage);
    }

    switch (errResponse.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email already exists';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage =
          'There is no user record corresponding to this identifier';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'The password is invalid';
        break;
    }

    return throwError(() => errorMessage);
  };
}
