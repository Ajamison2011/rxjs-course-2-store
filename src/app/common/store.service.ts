import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, timer } from "rxjs";
import { Course } from "../model/course";
import { createHttpObservable } from "./util";
import { delayWhen, filter, map, retryWhen, shareReplay, tap } from "rxjs/operators";
import { fromPromise } from "rxjs/internal-compatibility";

@Injectable({
    providedIn:'root'
})

export class Store {
    
    
    private subject = new BehaviorSubject<Course[]>([]);

    course$:Observable<Course[]> = this.subject.asObservable();

    init() {
        const http$ = createHttpObservable('/api/courses');

        const courses$: Observable<Course[]> = http$
            .pipe(
                tap(() => console.log("HTTP request executed")),
                map(res => Object.values(res["payload"]))
            ).subscribe(
                course => this.subject.next(course)
            );
    }

    selectBeginnerCourses(): Observable<Course[]> {
       return this.filterByCategory('BEGINNER');
    }
    selectAdvancedCourses(): Observable<Course[]> {
        return this.filterByCategory('ADVANCED');
     }

    filterByCategory(category:string){
       return this.course$
       .pipe(
            map( courses => courses
                .filter(course => course.category == category
        ))
        )
    }

    saveCourse(courseId: number, changes): Observable<any> {

        const courses = this.subject.getValue();
        const courseIndex = courses.findIndex(course => course.id == courseId);
        const newCourses = courses.slice(0);

        newCourses[courseIndex] = {
            ...courses[courseIndex],
            ...changes
        }

        this.subject.next(newCourses);
        return fromPromise(fetch(`/api/courses/${courseId}`,{
          method: 'PUT',
          body: JSON.stringify(changes),
          headers: {
              'content-type':'application/json'
          }
        }))
    }

    selectCourseById(courseId: number): Observable<Course> {
        return this.course$.pipe(
            map(courses => courses.find(course => course.id == courseId)),
            filter(course => !!course)
        )
    }
}