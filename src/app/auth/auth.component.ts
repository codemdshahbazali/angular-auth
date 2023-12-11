import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { AuthModel } from './autth.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  isLogInMode = true;
  isLoading = false;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSwitchMode() {
    this.isLogInMode = !this.isLogInMode;
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }

    const email = form.value.email;
    const password = form.value.password;
    let authObs: Observable<AuthModel>;

    this.isLoading = true;
    if (this.isLogInMode) {
      authObs = this.authService.login(email, password);
    } else {
      authObs = this.authService.signup(email, password);
    }

    authObs.subscribe({
      next: (response) => {
        this.error = null;
        this.isLoading = false;
        this.router.navigate(['/recipes']);
      },
      error: (errorRes) => {
        console.log(errorRes);
        this.error = errorRes;
        this.isLoading = false;
      },
    });
    form.reset();
  }
}
