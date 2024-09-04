/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LetModule } from '@ngrx/component';
import {
  BreadcrumbService,
  PortalCoreModule,
} from '@onecx/portal-integration-angular';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { BookmarksCreateUpdateComponent } from './bookmarks-create-update.component';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('BookmarksCreateUpdateComponent', () => {
  let component: BookmarksCreateUpdateComponent;
  let fixture: ComponentFixture<BookmarksCreateUpdateComponent>;

  const mockActivatedRoute = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BookmarksCreateUpdateComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetModule,
        TranslateTestingModule.withTranslations(
          'en',
          require('./../../../../../../assets/i18n/en.json')
        ).withTranslations(
          'de',
          require('./../../../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule,
      ],
      providers: [
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookmarksCreateUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
